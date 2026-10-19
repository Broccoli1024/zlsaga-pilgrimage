begin;
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path='' as $$
  select public.is_admin_member() and coalesce(auth.jwt()->>'aal','')='aal2';
$$;
commit;
