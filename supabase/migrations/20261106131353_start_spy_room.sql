create or replace function public.start_spy_room(
  p_room_id uuid,
  p_player_id uuid
)
returns public.spy_rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room public.spy_rooms%rowtype;
  v_player_count integer;
begin
  if (select auth.uid()) is null then
    raise exception 'UNAUTHORIZED';
  end if;

  select r.* into v_room
  from public.spy_rooms r
  where r.id = p_room_id
  for update;

  if not found or v_room.status <> 'waiting' then
    raise exception 'ROOM_NOT_WAITING';
  end if;

  if v_room.host_id <> (select auth.uid()) or not exists (
    select 1 from public.spy_room_players p
    where p.id = p_player_id
      and p.room_id = p_room_id
      and p.user_id = (select auth.uid())
      and p.is_host = true
  ) then
    raise exception 'NOT_ROOM_HOST';
  end if;

  select count(*) into v_player_count
  from public.spy_room_players p
  where p.room_id = p_room_id;

  if v_player_count < 4 then
    raise exception 'NOT_ENOUGH_PLAYERS';
  end if;

  update public.spy_rooms r
  set status = 'playing', current_phase = 'reveal', current_round = 1, updated_at = now()
  where r.id = p_room_id
  returning r.* into v_room;

  return v_room;
end;
$$;

revoke all on function public.start_spy_room(uuid, uuid) from public, anon;
grant execute on function public.start_spy_room(uuid, uuid) to authenticated;
