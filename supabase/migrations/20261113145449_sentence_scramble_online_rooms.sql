create table public.sentence_scramble_rooms (
  id uuid primary key default gen_random_uuid(),
  room_code text not null unique check (room_code ~ '^[A-F0-9]{8}$'),
  host_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (mode in ('individual', 'team')),
  status text not null default 'waiting' check (status in ('waiting', 'playing', 'finished')),
  created_at timestamptz not null default now(),
  started_at timestamptz,
  updated_at timestamptz not null default now()
);

create table public.sentence_scramble_room_slots (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.sentence_scramble_rooms(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 50),
  slot_type text not null check (slot_type in ('individual', 'team')),
  position smallint not null check (position > 0),
  created_at timestamptz not null default now(),
  unique (room_id, id),
  unique (room_id, position)
);

create unique index sentence_scramble_room_slots_unique_name
  on public.sentence_scramble_room_slots (room_id, lower(name));

create table public.sentence_scramble_room_assignments (
  room_id uuid not null,
  slot_id uuid primary key,
  sentences text[] not null check (cardinality(sentences) between 1 and 40),
  foreign key (room_id, slot_id)
    references public.sentence_scramble_room_slots(room_id, id) on delete cascade
);

create table public.sentence_scramble_room_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null,
  slot_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 1 and 40),
  individual_slot_id uuid unique references public.sentence_scramble_room_slots(id) on delete cascade,
  joined_at timestamptz not null default now(),
  foreign key (room_id, slot_id)
    references public.sentence_scramble_room_slots(room_id, id) on delete cascade,
  unique (room_id, user_id)
);

create unique index sentence_scramble_room_players_unique_name
  on public.sentence_scramble_room_players (room_id, lower(display_name));

create index sentence_scramble_room_players_slot_idx
  on public.sentence_scramble_room_players (room_id, slot_id);

alter table public.sentence_scramble_rooms enable row level security;
alter table public.sentence_scramble_room_slots enable row level security;
alter table public.sentence_scramble_room_assignments enable row level security;
alter table public.sentence_scramble_room_players enable row level security;

create policy "Room members can read sentence scramble rooms"
  on public.sentence_scramble_rooms for select to authenticated
  using (
    host_id = (select auth.uid())
    or exists (
      select 1 from public.sentence_scramble_room_players p
      where p.room_id = sentence_scramble_rooms.id
        and p.user_id = (select auth.uid())
    )
  );

create policy "Room hosts can start sentence scramble rooms"
  on public.sentence_scramble_rooms for update to authenticated
  using (host_id = (select auth.uid()) and status = 'waiting')
  with check (host_id = (select auth.uid()) and status = 'playing');

create policy "Room members can read sentence scramble slots"
  on public.sentence_scramble_room_slots for select to authenticated
  using (
    exists (
      select 1 from public.sentence_scramble_rooms r
      where r.id = room_id and r.host_id = (select auth.uid())
    )
    or exists (
      select 1 from public.sentence_scramble_room_players p
      where p.slot_id = sentence_scramble_room_slots.id
        and p.user_id = (select auth.uid())
    )
  );

create policy "Hosts and assigned players can read sentence scramble assignments"
  on public.sentence_scramble_room_assignments for select to authenticated
  using (
    exists (
      select 1 from public.sentence_scramble_rooms r
      where r.id = room_id and r.host_id = (select auth.uid())
    )
    or exists (
      select 1 from public.sentence_scramble_room_players p
      where p.room_id = sentence_scramble_room_assignments.room_id
        and p.slot_id = sentence_scramble_room_assignments.slot_id
        and p.user_id = (select auth.uid())
    )
  );

create policy "Players can read only their own sentence scramble membership"
  on public.sentence_scramble_room_players for select to authenticated
  using (user_id = (select auth.uid()));

grant select on public.sentence_scramble_rooms to authenticated;
grant update (status, started_at, updated_at) on public.sentence_scramble_rooms to authenticated;
grant select on public.sentence_scramble_room_slots to authenticated;
grant select on public.sentence_scramble_room_assignments to authenticated;
grant select on public.sentence_scramble_room_players to authenticated;

create or replace function public.create_sentence_scramble_room(
  p_mode text,
  p_targets jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room_id uuid;
  v_room_code text;
  v_target jsonb;
  v_slot_id uuid;
  v_sentences text[];
  v_position integer := 0;
begin
  if (select auth.uid()) is null then
    raise exception 'UNAUTHORIZED';
  end if;
  if p_mode is null or p_mode not in ('individual', 'team') then
    raise exception 'INVALID_MODE';
  end if;
  if jsonb_typeof(p_targets) is distinct from 'array' then
    raise exception 'INVALID_TARGETS';
  end if;
  if jsonb_array_length(p_targets) not between 2 and 16 then
    raise exception 'INVALID_TARGETS';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(p_targets) as target(value)
    group by lower(trim(target.value ->> 'name'))
    having count(*) > 1
  ) then
    raise exception 'DUPLICATE_TARGET_NAME';
  end if;

  for v_target in select value from jsonb_array_elements(p_targets)
  loop
    if char_length(trim(coalesce(v_target ->> 'name', ''))) not between 1 and 50
      or jsonb_typeof(v_target -> 'sentences') is distinct from 'array' then
      raise exception 'INVALID_TARGET_CONTENT';
    end if;
    if jsonb_array_length(v_target -> 'sentences') not between 1 and 40
      or exists (
        select 1 from jsonb_array_elements(v_target -> 'sentences') as item(value)
        where jsonb_typeof(item.value) <> 'string'
          or char_length(trim(item.value #>> '{}')) not between 1 and 500
      ) then
      raise exception 'INVALID_TARGET_CONTENT';
    end if;
  end loop;

  loop
    v_room_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    exit when not exists (
      select 1 from public.sentence_scramble_rooms r where r.room_code = v_room_code
    );
  end loop;

  insert into public.sentence_scramble_rooms (room_code, host_id, mode)
  values (v_room_code, (select auth.uid()), p_mode)
  returning id into v_room_id;

  for v_target in select value from jsonb_array_elements(p_targets)
  loop
    v_position := v_position + 1;
    insert into public.sentence_scramble_room_slots (room_id, name, slot_type, position)
    values (v_room_id, trim(v_target ->> 'name'), p_mode, v_position)
    returning id into v_slot_id;

    select array_agg(item.sentence order by item.ordinality)
      into v_sentences
    from jsonb_array_elements_text(v_target -> 'sentences') with ordinality
      as item(sentence, ordinality);

    insert into public.sentence_scramble_room_assignments (room_id, slot_id, sentences)
    values (v_room_id, v_slot_id, v_sentences);
  end loop;

  return jsonb_build_object('room_id', v_room_id, 'room_code', v_room_code);
end;
$$;

revoke all on function public.create_sentence_scramble_room(text, jsonb) from public, anon;
grant execute on function public.create_sentence_scramble_room(text, jsonb) to authenticated;

create or replace function public.list_sentence_scramble_targets(p_room_code text)
returns table (
  room_id uuid,
  mode text,
  room_status text,
  slot_id uuid,
  slot_name text,
  slot_type text
)
language sql
security definer
set search_path = ''
stable
as $$
  select r.id, r.mode, r.status, s.id, s.name, s.slot_type
  from public.sentence_scramble_rooms r
  join public.sentence_scramble_room_slots s on s.room_id = r.id
  where r.room_code = upper(trim(p_room_code))
    and r.status = 'waiting'
    and (select auth.uid()) is not null
  order by s.position;
$$;

revoke all on function public.list_sentence_scramble_targets(text) from public, anon;
grant execute on function public.list_sentence_scramble_targets(text) to authenticated;

create or replace function public.join_sentence_scramble_room(
  p_room_code text,
  p_slot_id uuid,
  p_player_name text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room public.sentence_scramble_rooms%rowtype;
  v_slot public.sentence_scramble_room_slots%rowtype;
  v_player_id uuid;
  v_display_name text := trim(coalesce(p_player_name, ''));
begin
  if (select auth.uid()) is null then
    raise exception 'UNAUTHORIZED';
  end if;
  if char_length(v_display_name) not between 1 and 40 then
    raise exception 'INVALID_PLAYER_NAME';
  end if;

  select r.* into v_room
  from public.sentence_scramble_rooms r
  where r.room_code = upper(trim(p_room_code))
  for update;
  if not found then
    raise exception 'ROOM_NOT_FOUND';
  end if;
  if v_room.status <> 'waiting' then
    raise exception 'ROOM_NOT_JOINABLE';
  end if;

  select s.* into v_slot
  from public.sentence_scramble_room_slots s
  where s.id = p_slot_id and s.room_id = v_room.id;
  if not found then
    raise exception 'TARGET_NOT_FOUND';
  end if;
  if v_room.mode = 'individual' and lower(v_display_name) <> lower(v_slot.name) then
    raise exception 'PLAYER_NAME_MUST_MATCH_TARGET';
  end if;
  if exists (
    select 1 from public.sentence_scramble_room_players p
    where p.room_id = v_room.id and p.user_id = (select auth.uid())
  ) then
    raise exception 'ALREADY_JOINED';
  end if;
  if v_room.mode = 'individual' and exists (
    select 1 from public.sentence_scramble_room_players p where p.slot_id = v_slot.id
  ) then
    raise exception 'TARGET_ALREADY_JOINED';
  end if;

  insert into public.sentence_scramble_room_players (
    room_id, slot_id, user_id, display_name, individual_slot_id
  ) values (
    v_room.id,
    v_slot.id,
    (select auth.uid()),
    v_display_name,
    case when v_room.mode = 'individual' then v_slot.id else null end
  )
  returning id into v_player_id;

  return jsonb_build_object(
    'room_id', v_room.id,
    'room_code', v_room.room_code,
    'player_id', v_player_id,
    'slot_id', v_slot.id
  );
end;
$$;

revoke all on function public.join_sentence_scramble_room(text, uuid, text) from public, anon;
grant execute on function public.join_sentence_scramble_room(text, uuid, text) to authenticated;

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
    'created_at', v_room.created_at,
    'started_at', v_room.started_at,
    'targets', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id,
        'name', s.name,
        'slot_type', s.slot_type,
        'position', s.position,
        'player_count', coalesce(counts.player_count, 0)
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

create or replace function public.start_sentence_scramble_room(p_room_id uuid)
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
  if v_room.status <> 'waiting' then
    raise exception 'ROOM_NOT_WAITING';
  end if;
  if exists (
    select 1
    from public.sentence_scramble_room_slots s
    where s.room_id = v_room.id
      and not exists (
        select 1 from public.sentence_scramble_room_players p
        where p.slot_id = s.id
      )
  ) then
    raise exception 'TARGETS_NOT_READY';
  end if;

  update public.sentence_scramble_rooms r
  set status = 'playing', started_at = now(), updated_at = now()
  where r.id = v_room.id;

  return jsonb_build_object('room_id', v_room.id, 'status', 'playing');
end;
$$;

revoke all on function public.start_sentence_scramble_room(uuid) from public, anon;
grant execute on function public.start_sentence_scramble_room(uuid) to authenticated;
