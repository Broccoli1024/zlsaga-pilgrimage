begin;
-- Keep safe-update protection enabled; only touch backups containing this account.
create or replace function public.delete_account_activity(target_user uuid) returns void
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
  )
  where exists (
    select 1 from jsonb_each(b.related_data) entry
    cross join lateral jsonb_array_elements(
      case when jsonb_typeof(entry.value)='array' then entry.value else '[]'::jsonb end
    ) item
    where item->>'user_id'=target_user::text
       or item->>'route_id' in(select id::text from public.routes where user_id=target_user)
  );
  delete from public.event_logs where user_id=target_user or route_id in(select id from public.routes where user_id=target_user);
end; $$;
commit;
