begin;

-- Private originals: all reads, including anonymous reads, require an approved row.
create table public.spot_photos (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references public.spots(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null unique,
  caption text not null default '' check (char_length(caption) <= 200),
  status text not null default 'uploading' check (status in ('uploading','pending','approved','rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  check (storage_path = user_id::text || '/' || id::text || '.jpg')
);
create index spot_photos_gallery on public.spot_photos(spot_id, status, created_at desc);
create index spot_photos_owner on public.spot_photos(user_id);
create table public.spot_photo_reports (
  photo_id uuid not null references public.spot_photos(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (char_length(reason) between 1 and 500),
  created_at timestamptz not null default now(),
  primary key (photo_id, user_id)
);

-- Matches the existing site's administrator, using verified server-side identity.
create function public.is_photo_admin() returns boolean language sql stable security definer
set search_path = '' as $$
  select exists(select 1 from auth.users where id = auth.uid()
    and email = 'rikurin2016@gmail.com' and email_confirmed_at is not null);
$$;
revoke all on function public.is_photo_admin() from public;
grant execute on function public.is_photo_admin() to anon, authenticated;

alter table public.spot_photos enable row level security;
alter table public.spot_photo_reports enable row level security;
revoke all on public.spot_photos, public.spot_photo_reports from anon, authenticated;
grant select on public.spot_photos to anon, authenticated;
grant select, insert on public.spot_photo_reports to authenticated;
create policy photo_read on public.spot_photos for select using (
  (status = 'approved' and exists(select 1 from public.spots where id = spot_id and is_published))
  or user_id = auth.uid() or public.is_photo_admin()
);
create policy report_read on public.spot_photo_reports for select to authenticated
using (user_id = auth.uid() or public.is_photo_admin());
create policy report_insert on public.spot_photo_reports for insert to authenticated
with check (user_id = auth.uid() and exists(select 1 from public.spot_photos where id = photo_id and status = 'approved'));

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('spot-photos', 'spot-photos', false, 1048576, array['image/jpeg']);
create policy spot_photo_object_read on storage.objects for select to anon, authenticated
using (bucket_id = 'spot-photos' and exists (
  select 1 from public.spot_photos p where p.storage_path = name
));
create policy spot_photo_object_insert on storage.objects for insert to authenticated
with check (bucket_id = 'spot-photos' and exists (
  select 1 from public.spot_photos p where p.storage_path = name
  and p.user_id = auth.uid() and p.status = 'uploading'
));
-- No UPDATE policy: an approved image cannot be replaced after review.
create policy spot_photo_object_delete on storage.objects for delete to authenticated
using (bucket_id = 'spot-photos' and exists (
  select 1 from public.spot_photos p where p.storage_path = name
  and (p.user_id = auth.uid() or public.is_photo_admin())
));

create function public.reserve_spot_photo(target_spot uuid, photo_caption text default '')
returns public.spot_photos language plpgsql security definer set search_path = '' as $$
declare result public.spot_photos; photo_id uuid := gen_random_uuid(); viewer uuid := auth.uid();
begin
  if viewer is null then raise exception 'Login required'; end if;
  -- Serialise reservations per user: direct API requests cannot evade the quota.
  perform pg_advisory_xact_lock(hashtextextended(viewer::text, 0));
  if not exists(select 1 from public.spots where id = target_spot and is_published) then
    raise exception 'Spot unavailable'; end if;
  if (select count(*) from public.spot_photos where user_id = viewer) >= 30 then
    raise exception 'Photo quota reached (30). Delete an existing photo first.'; end if;
  insert into public.spot_photos(id, spot_id, user_id, storage_path, caption)
  values (photo_id, target_spot, viewer, viewer::text || '/' || photo_id::text || '.jpg', trim(photo_caption))
  returning * into result;
  return result;
end; $$;
create function public.submit_spot_photo(photo_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.spot_photos p set status = 'pending'
  where p.id = photo_id and p.user_id = auth.uid() and p.status = 'uploading'
    and exists(select 1 from storage.objects o where o.bucket_id = 'spot-photos' and o.name = p.storage_path);
  if not found then raise exception 'Upload not complete'; end if;
end; $$;
create function public.review_spot_photo(photo_id uuid, decision text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_photo_admin() then raise exception 'Admin required'; end if;
  if decision not in ('approved', 'rejected') then raise exception 'Invalid decision'; end if;
  update public.spot_photos p set status = decision, reviewed_at = now()
  where id = photo_id and status <> 'uploading'
    and exists(select 1 from storage.objects o where o.bucket_id = 'spot-photos' and o.name = p.storage_path);
  if not found then raise exception 'Photo unavailable'; end if;
end; $$;
revoke all on function public.reserve_spot_photo(uuid,text), public.submit_spot_photo(uuid), public.review_spot_photo(uuid,text) from public;
grant execute on function public.reserve_spot_photo(uuid,text), public.submit_spot_photo(uuid), public.review_spot_photo(uuid,text) to authenticated;
create function public.delete_spot_photo_record(photo_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  delete from public.spot_photos p where id = photo_id
  and (user_id = auth.uid() or public.is_photo_admin())
  and not exists(select 1 from storage.objects o where o.bucket_id = 'spot-photos' and o.name = p.storage_path);
  if not found then raise exception 'Remove image before deleting its record'; end if;
end; $$;
revoke all on function public.delete_spot_photo_record(uuid) from public;
grant execute on function public.delete_spot_photo_record(uuid) to authenticated;
commit;
