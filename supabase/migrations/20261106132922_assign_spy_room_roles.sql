create function public.start_spy_room(
  p_room_id uuid,
  p_player_id uuid,
  p_settings jsonb,
  p_word_pair jsonb
)
returns public.spy_rooms
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_room public.spy_rooms%rowtype;
  v_player_count integer;
  v_role_count integer;
  v_spy_count integer;
  v_mode text;
  v_word text;
  v_spy_word text;
begin
  if (select auth.uid()) is null then
    raise exception 'UNAUTHORIZED';
  end if;

  select r.* into v_room
  from public.spy_rooms r
  where r.id = p_room_id
  for update;

  if not found then
    raise exception 'ROOM_NOT_FOUND';
  end if;

  if v_room.status <> 'waiting'
    and not (v_room.status = 'playing' and v_room.current_phase = 'reveal' and v_room.current_round = 1) then
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

  select count(*) into v_role_count
  from public.spy_player_roles r
  where r.room_id = p_room_id;

  if v_role_count > 0 then
    raise exception 'ROLES_ALREADY_ASSIGNED';
  end if;

  v_spy_count := coalesce((p_settings ->> 'spyCount')::integer, 1);
  v_mode := coalesce(p_settings ->> 'mode', 'different-word');
  v_word := nullif(trim(p_word_pair ->> 'word'), '');
  v_spy_word := nullif(trim(p_word_pair ->> 'spyWord'), '');

  if v_spy_count < 1 or v_spy_count > greatest(1, floor(v_player_count::numeric / 3)::integer) then
    raise exception 'INVALID_SPY_COUNT';
  end if;

  if v_mode not in ('different-word', 'no-word') then
    raise exception 'INVALID_GAME_MODE';
  end if;

  if v_word is null or (v_mode = 'different-word' and v_spy_word is null) then
    raise exception 'INVALID_WORD_PAIR';
  end if;

  with randomized_players as (
    select p.id, row_number() over (order by random()) as position
    from public.spy_room_players p
    where p.room_id = p_room_id
  )
  insert into public.spy_player_roles (room_id, player_id, role, secret_word)
  select
    p_room_id,
    p.id,
    case when p.position <= v_spy_count then 'spy' else 'civilian' end,
    case
      when p.position > v_spy_count then v_word
      when v_mode = 'different-word' then v_spy_word
      else null
    end
  from randomized_players p;

  update public.spy_rooms r
  set status = 'playing',
      current_phase = 'reveal',
      current_round = 1,
      settings = jsonb_build_object(
        'spyCount', v_spy_count,
        'mode', v_mode,
        'category', coalesce(p_settings ->> 'category', 'Tất cả chủ đề'),
        'discussionMinutes', coalesce((p_settings ->> 'discussionMinutes')::integer, 5)
      ),
      updated_at = now()
  where r.id = p_room_id
  returning r.* into v_room;

  return v_room;
end;
$$;

revoke all on function public.start_spy_room(uuid, uuid, jsonb, jsonb) from public, anon;
grant execute on function public.start_spy_room(uuid, uuid, jsonb, jsonb) to authenticated;

create policy "Room hosts can recover initial role assignment"
on public.spy_rooms
for update
to authenticated
using (
  host_id = (select auth.uid())
  and status = 'playing'
  and current_phase = 'reveal'
  and current_round = 1
)
with check (
  host_id = (select auth.uid())
  and status = 'playing'
  and current_phase = 'reveal'
  and current_round = 1
);

create policy "Room hosts can assign roles"
on public.spy_player_roles
for insert
to authenticated
with check (
  exists (
    select 1 from public.spy_rooms r
    where r.id = room_id
      and r.host_id = (select auth.uid())
      and (
        r.status = 'waiting'
        or (r.status = 'playing' and r.current_phase = 'reveal' and r.current_round = 1)
      )
  )
  and exists (
    select 1 from public.spy_room_players p
    where p.id = player_id
      and p.room_id = public.spy_player_roles.room_id
  )
);

grant update (settings) on public.spy_rooms to authenticated;
grant insert on public.spy_player_roles to authenticated;
