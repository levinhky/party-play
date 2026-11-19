create or replace function public.cancel_taboo_room(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room public.taboo_rooms%rowtype;
begin
  if (select auth.uid()) is null then
    raise exception 'UNAUTHORIZED';
  end if;

  select r.* into v_room
  from public.taboo_rooms r
  where r.id = p_room_id
  for update;

  if not found then
    raise exception 'ROOM_NOT_FOUND';
  end if;

  if v_room.host_id <> (select auth.uid()) then
    raise exception 'NOT_ROOM_HOST';
  end if;

  delete from public.taboo_rooms
  where id = p_room_id;
end;
$$;

revoke all on function public.cancel_taboo_room(uuid) from public, anon;
grant execute on function public.cancel_taboo_room(uuid) to authenticated;

notify pgrst, 'reload schema';
