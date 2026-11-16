create or replace function public.host_finish_sentence_scramble_room(p_room_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room public.sentence_scramble_rooms%rowtype;
begin
  if (select auth.uid()) is null then
    raise exception 'UNAUTHORIZED';
  end if;

  select r.* into v_room
  from public.sentence_scramble_rooms r
  where r.id = p_room_id
  for update;
  if not found then
    raise exception 'ROOM_NOT_FOUND';
  end if;
  if v_room.host_id <> (select auth.uid()) then
    raise exception 'NOT_ROOM_HOST';
  end if;
  if v_room.status <> 'playing' then
    raise exception 'ROOM_NOT_PLAYING';
  end if;

  update public.sentence_scramble_rooms r
  set status = 'finished', updated_at = now()
  where r.id = v_room.id;

  return jsonb_build_object('room_id', v_room.id, 'status', 'finished');
end;
$$;

revoke all on function public.host_finish_sentence_scramble_room(uuid) from public, anon;
grant execute on function public.host_finish_sentence_scramble_room(uuid) to authenticated;
