alter table public.sentence_scramble_rooms
  add column time_limit_minutes integer not null default 5
    check (time_limit_minutes between 1 and 60);

alter table public.sentence_scramble_room_slots
  add column answer_viewed_at timestamptz,
  add column finished_at timestamptz;

create or replace function public.create_sentence_scramble_room(
  p_mode text,
  p_targets jsonb,
  p_duration_minutes integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room jsonb;
begin
  if (select auth.uid()) is null then
    raise exception 'UNAUTHORIZED';
  end if;
  if p_duration_minutes is null or p_duration_minutes not between 1 and 60 then
    raise exception 'INVALID_DURATION';
  end if;

  v_room := public.create_sentence_scramble_room(p_mode, p_targets);
  update public.sentence_scramble_rooms r
  set time_limit_minutes = p_duration_minutes
  where r.id = (v_room ->> 'room_id')::uuid
    and r.host_id = (select auth.uid());

  return v_room;
end;
$$;

revoke all on function public.create_sentence_scramble_room(text, jsonb, integer) from public, anon;
grant execute on function public.create_sentence_scramble_room(text, jsonb, integer) to authenticated;

create or replace function public.get_sentence_scramble_lobby(p_room_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
stable
as $$
declare
  v_room public.sentence_scramble_rooms%rowtype;
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception 'UNAUTHORIZED';
  end if;

  select r.* into v_room
  from public.sentence_scramble_rooms r
  where r.id = p_room_id;
  if not found then
    raise exception 'ROOM_NOT_FOUND';
  end if;
  if v_room.host_id <> v_uid and not exists (
    select 1 from public.sentence_scramble_room_players p
    where p.room_id = v_room.id and p.user_id = v_uid
  ) then
    raise exception 'NOT_ROOM_MEMBER';
  end if;

  return jsonb_build_object(
    'id', v_room.id,
    'room_code', v_room.room_code,
    'host_id', v_room.host_id,
    'is_host', v_room.host_id = v_uid,
    'mode', v_room.mode,
    'status', v_room.status,
    'time_limit_minutes', v_room.time_limit_minutes,
    'created_at', v_room.created_at,
    'started_at', v_room.started_at,
    'targets', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id,
        'name', s.name,
        'slot_type', s.slot_type,
        'position', s.position,
        'player_count', coalesce(counts.player_count, 0),
        'answer_viewed', s.answer_viewed_at is not null,
        'finished', s.finished_at is not null
      ) order by s.position)
      from public.sentence_scramble_room_slots s
      left join (
        select p.slot_id, count(*)::integer as player_count
        from public.sentence_scramble_room_players p
        where p.room_id = v_room.id
        group by p.slot_id
      ) counts on counts.slot_id = s.id
      where s.room_id = v_room.id
    ), '[]'::jsonb),
    'players', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id,
        'slot_id', p.slot_id,
        'display_name', p.display_name,
        'target_name', s.name
      ) order by p.joined_at)
      from public.sentence_scramble_room_players p
      join public.sentence_scramble_room_slots s on s.id = p.slot_id
      where p.room_id = v_room.id
    ), '[]'::jsonb),
    'my_players', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id,
        'slot_id', p.slot_id,
        'display_name', p.display_name,
        'target_name', s.name
      ) order by p.joined_at)
      from public.sentence_scramble_room_players p
      join public.sentence_scramble_room_slots s on s.id = p.slot_id
      where p.room_id = v_room.id and p.user_id = v_uid
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.get_sentence_scramble_lobby(uuid) from public, anon;
grant execute on function public.get_sentence_scramble_lobby(uuid) to authenticated;

create or replace function public.mark_sentence_scramble_answers_viewed(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_room public.sentence_scramble_rooms%rowtype;
  v_updated integer;
begin
  if v_uid is null then raise exception 'UNAUTHORIZED'; end if;
  select r.* into v_room from public.sentence_scramble_rooms r where r.id = p_room_id;
  if not found then raise exception 'ROOM_NOT_FOUND'; end if;
  if v_room.status <> 'playing' then raise exception 'ROOM_NOT_PLAYING'; end if;

  update public.sentence_scramble_room_slots s
  set answer_viewed_at = coalesce(s.answer_viewed_at, now())
  where s.room_id = v_room.id
    and exists (
      select 1 from public.sentence_scramble_room_players p
      where p.room_id = v_room.id and p.slot_id = s.id and p.user_id = v_uid
    );
  get diagnostics v_updated = row_count;
  if v_updated = 0 then raise exception 'NOT_ROOM_PLAYER'; end if;
end;
$$;

revoke all on function public.mark_sentence_scramble_answers_viewed(uuid) from public, anon;
grant execute on function public.mark_sentence_scramble_answers_viewed(uuid) to authenticated;

create or replace function public.finish_sentence_scramble_target(p_room_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_room public.sentence_scramble_rooms%rowtype;
  v_updated integer;
  v_status text;
begin
  if v_uid is null then raise exception 'UNAUTHORIZED'; end if;
  select r.* into v_room from public.sentence_scramble_rooms r where r.id = p_room_id for update;
  if not found then raise exception 'ROOM_NOT_FOUND'; end if;
  if v_room.status <> 'playing' then raise exception 'ROOM_NOT_PLAYING'; end if;

  update public.sentence_scramble_room_slots s
  set finished_at = coalesce(s.finished_at, now())
  where s.room_id = v_room.id
    and exists (
      select 1 from public.sentence_scramble_room_players p
      where p.room_id = v_room.id and p.slot_id = s.id and p.user_id = v_uid
    );
  get diagnostics v_updated = row_count;
  if v_updated = 0 then raise exception 'NOT_ROOM_PLAYER'; end if;

  if not exists (
    select 1 from public.sentence_scramble_room_slots s
    where s.room_id = v_room.id and s.finished_at is null
  ) then
    update public.sentence_scramble_rooms r
    set status = 'finished', updated_at = now()
    where r.id = v_room.id;
    v_status := 'finished';
  else
    v_status := 'playing';
  end if;

  return jsonb_build_object('room_id', v_room.id, 'status', v_status);
end;
$$;

revoke all on function public.finish_sentence_scramble_target(uuid) from public, anon;
grant execute on function public.finish_sentence_scramble_target(uuid) to authenticated;
