begin;
create table public.admin_memberships (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admin_memberships enable row level security;
revoke all on public.admin_memberships from public, anon, authenticated;
grant select, insert, delete on public.admin_memberships to service_role;

-- Capture existing administrators with the OLD server-side predicate before replacing it.
-- Do not embed an email address, accept client metadata, or grant access to other accounts.
do $$
declare candidate uuid; previous_claim text := current_setting('request.jwt.claim.sub', true);
begin
  for candidate in select id from auth.users where email_confirmed_at is not null loop
    perform set_config('request.jwt.claim.sub', candidate::text, true);
    if public.is_photo_admin() then
      insert into public.admin_memberships(user_id) values(candidate);
    end if;
  end loop;
  perform set_config('request.jwt.claim.sub', coalesce(previous_claim,''), true);
  if (select count(*) from public.admin_memberships) <> 1 then
    raise exception 'Expected exactly one existing administrator; migration aborted';
  end if;
end; $$;

create function public.is_admin() returns boolean
language sql stable security definer set search_path='' as $$
  select exists (
    select 1 from public.admin_memberships m join auth.users u on u.id=m.user_id
    where m.user_id=auth.uid() and u.email_confirmed_at is not null
  );
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- Keep the existing RLS/RPC entry point; all photo permissions now use the same registry.
create or replace function public.is_photo_admin() returns boolean
language sql stable security definer set search_path='' as $$
  select public.is_admin();
$$;
-- Existing spot/tag/import-log policies must follow the same membership registry.
alter policy spots_admin_insert on public.spots with check (public.is_admin());
alter policy spots_admin_update on public.spots using (public.is_admin()) with check (public.is_admin());
alter policy spots_admin_delete on public.spots using (public.is_admin());
alter policy form_response_log_admin_read on public.form_response_log using (public.is_admin());
alter policy spot_sig_tags_admin_insert on public.spot_significance_tags with check (public.is_admin());
alter policy spot_sig_tags_admin_delete on public.spot_significance_tags using (public.is_admin());
commit;
