begin;
-- Membership alone allows the setup screen, never a privileged operation.
create function public.is_admin_member() returns boolean
language sql stable security definer set search_path='' as $$
  select exists (
    select 1 from public.admin_memberships m join auth.users u on u.id=m.user_id
    where m.user_id=auth.uid() and u.email_confirmed_at is not null
  );
$$;
revoke all on function public.is_admin_member() from public;
grant execute on function public.is_admin_member() to anon,authenticated;
commit;
