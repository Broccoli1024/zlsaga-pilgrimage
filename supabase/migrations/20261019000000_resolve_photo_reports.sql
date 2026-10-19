begin;
alter table public.spot_photo_reports add column resolved_at timestamptz;
-- Clients may create reports, but cannot mark their own reports resolved.
revoke insert on public.spot_photo_reports from authenticated;
grant insert (photo_id, user_id, reason) on public.spot_photo_reports to authenticated;
create function public.resolve_spot_photo_report(target_photo uuid, reporter uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_photo_admin() then
    raise exception 'Admin required' using errcode = '42501';
  end if;
  update public.spot_photo_reports set resolved_at = now()
  where photo_id = target_photo and user_id = reporter and resolved_at is null;
end;
$$;
revoke all on function public.resolve_spot_photo_report(uuid,uuid) from public;
grant execute on function public.resolve_spot_photo_report(uuid,uuid) to authenticated;
commit;
