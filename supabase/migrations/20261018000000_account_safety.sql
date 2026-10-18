begin;
create table public.user_blocks (
  user_id uuid not null references auth.users(id) on delete cascade,
  blocked_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_id, blocked_user_id),
  check(user_id <> blocked_user_id)
);
alter table public.user_blocks enable row level security;
revoke all on public.user_blocks from anon, authenticated;
grant select, insert, delete on public.user_blocks to authenticated;
create policy own_blocks on public.user_blocks for select to authenticated using(user_id=auth.uid());
create policy add_block on public.user_blocks for insert to authenticated with check(user_id=auth.uid());
create policy remove_block on public.user_blocks for delete to authenticated using(user_id=auth.uid());
create function public.has_blocked_author(author_id uuid) returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.user_blocks where user_id=auth.uid() and blocked_user_id=author_id);
$$;
revoke all on function public.has_blocked_author(uuid) from public;
grant execute on function public.has_blocked_author(uuid) to anon, authenticated;

create table public.user_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reported_user_id uuid not null references auth.users(id) on delete cascade,
  photo_id uuid references public.spot_photos(id) on delete set null,
  reason text not null check(char_length(reason) between 1 and 500),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  unique(reporter_id, reported_user_id),
  check(reporter_id <> reported_user_id)
);
alter table public.user_reports enable row level security;
revoke all on public.user_reports from anon, authenticated;
grant select on public.user_reports to authenticated;
create policy read_user_reports on public.user_reports for select to authenticated using(reporter_id=auth.uid() or public.is_photo_admin());
create function public.report_photo_author(target_photo uuid, report_reason text) returns void
language plpgsql security definer set search_path='' as $$
declare author uuid;
begin
  if auth.uid() is null then raise exception 'Login required'; end if;
  select p.user_id into author from public.spot_photos p join public.spots s on s.id=p.spot_id
    where p.id=target_photo and p.status='approved' and s.is_published;
  if author is null or author=auth.uid() then raise exception 'Invalid author'; end if;
  insert into public.user_reports(reporter_id,reported_user_id,photo_id,reason)
  values(auth.uid(),author,target_photo,trim(report_reason))
  on conflict(reporter_id,reported_user_id) do update set reason=excluded.reason,photo_id=excluded.photo_id,resolved_at=null,created_at=now();
end; $$;
create function public.resolve_user_report(report_id uuid, hide_photos boolean default false) returns void
language plpgsql security definer set search_path='' as $$
declare author uuid;
begin
  if not public.is_photo_admin() then raise exception 'Admin required'; end if;
  select reported_user_id into author from public.user_reports where id=report_id;
  if author is null then raise exception 'Report not found'; end if;
  if hide_photos then update public.spot_photos set status='rejected',reviewed_at=now() where user_id=author and status in ('approved','pending'); end if;
  update public.user_reports set resolved_at=now() where id=report_id;
end; $$;
revoke all on function public.report_photo_author(uuid,text),public.resolve_user_report(uuid,boolean) from public;
grant execute on function public.report_photo_author(uuid,text),public.resolve_user_report(uuid,boolean) to authenticated;

create table public.account_deletions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null check(status in ('processing','failed')),
  updated_at timestamptz not null default now()
);
alter table public.account_deletions enable row level security;
revoke all on public.account_deletions from anon, authenticated;
grant all on public.account_deletions to service_role;
create function public.is_account_deleting(target_user uuid) returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.account_deletions where user_id=target_user);
$$;
revoke all on function public.is_account_deleting(uuid) from public;
grant execute on function public.is_account_deleting(uuid) to anon,authenticated;
create function public.can_upload_for_account() returns boolean language sql stable security definer set search_path='' as $$
  select exists(select 1 from auth.users where id=auth.uid()) and not public.is_account_deleting(auth.uid());
$$;
revoke all on function public.can_upload_for_account() from public;
grant execute on function public.can_upload_for_account() to authenticated;
create policy stop_uploads_during_deletion on storage.objects as restrictive for insert to authenticated
with check(public.can_upload_for_account());
create policy stop_updates_during_deletion on storage.objects as restrictive for update to authenticated
using(public.can_upload_for_account()) with check(public.can_upload_for_account());

drop policy photo_read on public.spot_photos;
create policy photo_read on public.spot_photos for select using (
  (status='approved' and not public.has_blocked_author(user_id) and not public.is_account_deleting(user_id)
    and exists(select 1 from public.spots where id=spot_id and is_published))
  or user_id=auth.uid() or public.is_photo_admin()
);
create function public.begin_account_deletion(target_user uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(target_user::text,0));
  if exists(select 1 from public.account_deletions where user_id=target_user and status='processing' and updated_at>now()-interval '3 minutes') then
    raise exception 'Deletion already processing'; end if;
  insert into public.account_deletions(user_id,status) values(target_user,'processing')
    on conflict(user_id) do update set status='processing',updated_at=now();
end; $$;
create function public.account_deletion_objects(target_user uuid) returns table(bucket_id text, name text)
language sql security definer set search_path='' as $$
  select o.bucket_id,o.name from storage.objects o where o.owner_id=target_user::text
    or (o.bucket_id in ('spot-photos','profile-icons') and split_part(o.name,'/',1)=target_user::text)
  order by o.bucket_id,o.name limit 100;
$$;
revoke all on function public.begin_account_deletion(uuid),public.account_deletion_objects(uuid) from public,anon,authenticated;
grant execute on function public.begin_account_deletion(uuid),public.account_deletion_objects(uuid) to service_role;

create or replace function public.reserve_spot_photo(target_spot uuid, photo_caption text default '')
returns public.spot_photos language plpgsql security definer set search_path = '' as $$
declare result public.spot_photos; photo_id uuid := gen_random_uuid(); viewer uuid := auth.uid();
begin
  if viewer is null then raise exception 'Login required'; end if;
  -- Serialise reservations per user: direct API requests cannot evade the quota.
  perform pg_advisory_xact_lock(hashtextextended(viewer::text, 0));
  if public.is_account_deleting(viewer) then raise exception 'Account deletion in progress'; end if;
  if not exists(select 1 from public.spots where id = target_spot and is_published) then
    raise exception 'Spot unavailable'; end if;
  if (select count(*) from public.spot_photos where user_id = viewer) >= 30 then
    raise exception 'Photo quota reached (30). Delete an existing photo first.'; end if;
  insert into public.spot_photos(id, spot_id, user_id, storage_path, caption)
  values (photo_id, target_spot, viewer, viewer::text || '/' || photo_id::text || '.jpg', trim(photo_caption))
  returning * into result;
  return result;
end; $$;

create function public.delete_account_activity(target_user uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
  if not public.is_account_deleting(target_user) then raise exception 'Deletion not started'; end if;
  update public.spot_merge_backups b set related_data=(
    select jsonb_object_agg(entry.key,case when jsonb_typeof(entry.value)='array' then
      coalesce((select jsonb_agg(item) from jsonb_array_elements(entry.value) item
        where coalesce(item->>'user_id','')<>target_user::text
        and coalesce(item->>'route_id','') not in(select id::text from public.routes where user_id=target_user)), '[]'::jsonb)
      else entry.value end)
    from jsonb_each(b.related_data) entry
  );
  delete from public.event_logs where user_id=target_user or route_id in(select id from public.routes where user_id=target_user);
end; $$;
revoke all on function public.delete_account_activity(uuid) from public,anon,authenticated;
grant execute on function public.delete_account_activity(uuid) to service_role;
commit;
