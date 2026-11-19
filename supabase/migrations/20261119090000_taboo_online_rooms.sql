create table public.taboo_rooms (
  id uuid primary key default gen_random_uuid(),
  room_code text not null unique check (room_code ~ '^[A-F0-9]{8}$'),
  host_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (mode in ('individual', 'team')),
  status text not null default 'waiting' check (status in ('waiting', 'playing', 'finished')),
  deck_distribution text not null default 'shared' check (deck_distribution in ('shared', 'split')),
  turn_duration integer not null check (turn_duration between 1 and 3600),
  rounds integer not null check (rounds between 1 and 20),
  cards jsonb not null default '[]'::jsonb,
  current_slot_id uuid,
  current_round integer not null default 1,
  current_card_index integer not null default 0,
  turn_started_at timestamptz,
  correct_count integer not null default 0,
  skipped_count integer not null default 0,
  forbidden_count integer not null default 0,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  updated_at timestamptz not null default now()
);

create table public.taboo_room_slots (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.taboo_rooms(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 50),
  position smallint not null check (position > 0),
  slot_type text not null check (slot_type in ('individual', 'team')),
  score integer not null default 0,
  card_index integer not null default 0,
  created_at timestamptz not null default now(),
  unique (room_id, position),
  unique (room_id, id)
);

create unique index taboo_room_slots_unique_name
  on public.taboo_room_slots (room_id, lower(name));

alter table public.taboo_rooms
  add constraint taboo_rooms_current_slot_fk
  foreign key (id, current_slot_id)
  references public.taboo_room_slots(room_id, id)
  deferrable initially deferred;

create table public.taboo_room_slot_cards (
  room_id uuid not null references public.taboo_rooms(id) on delete cascade,
  slot_id uuid primary key,
  cards jsonb not null check (jsonb_typeof(cards) = 'array'),
  foreign key (room_id, slot_id)
    references public.taboo_room_slots(room_id, id) on delete cascade
);

create table public.taboo_room_players (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null,
  slot_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) between 1 and 40),
  is_host boolean not null default false,
  joined_at timestamptz not null default now(),
  unique (room_id, user_id),
  foreign key (room_id, slot_id)
    references public.taboo_room_slots(room_id, id) on delete cascade
);

create unique index taboo_room_players_unique_name
  on public.taboo_room_players (room_id, lower(display_name));

create index taboo_room_players_slot_idx
  on public.taboo_room_players (room_id, slot_id);

alter table public.taboo_rooms enable row level security;
alter table public.taboo_room_slots enable row level security;
alter table public.taboo_room_slot_cards enable row level security;
alter table public.taboo_room_players enable row level security;

create policy "Taboo room hosts and members can read rooms"
  on public.taboo_rooms for select to authenticated
  using (
    host_id = (select auth.uid())
    or exists (
      select 1 from public.taboo_room_players p
      where p.room_id = taboo_rooms.id and p.user_id = (select auth.uid())
    )
  );

create policy "Taboo room hosts can update rooms"
  on public.taboo_rooms for update to authenticated
  using (host_id = (select auth.uid()))
  with check (host_id = (select auth.uid()));

create policy "Taboo room hosts and members can read slots"
  on public.taboo_room_slots for select to authenticated
  using (
    exists (
      select 1 from public.taboo_rooms r
      where r.id = taboo_room_slots.room_id and r.host_id = (select auth.uid())
    )
    or exists (
      select 1 from public.taboo_room_players p
      where p.room_id = taboo_room_slots.room_id and p.user_id = (select auth.uid())
    )
  );

create policy "Taboo room hosts and members can read players"
  on public.taboo_room_players for select to authenticated
  using (
    exists (
      select 1 from public.taboo_rooms r
      where r.id = taboo_room_players.room_id and r.host_id = (select auth.uid())
    )
    or user_id = (select auth.uid())
  );

create policy "Taboo hosts and current players can read slot cards"
  on public.taboo_room_slot_cards for select to authenticated
  using (
    exists (
      select 1 from public.taboo_rooms r
      where r.id = taboo_room_slot_cards.room_id
        and r.host_id = (select auth.uid())
    )
    or exists (
      select 1 from public.taboo_rooms r
      join public.taboo_room_players p on p.slot_id = r.current_slot_id
      where r.id = taboo_room_slot_cards.room_id
        and p.room_id = r.id
        and p.user_id = (select auth.uid())
        and p.slot_id = taboo_room_slot_cards.slot_id
    )
  );

grant select on public.taboo_rooms to authenticated;
grant select on public.taboo_room_slots to authenticated;
grant select on public.taboo_room_players to authenticated;
grant select on public.taboo_room_slot_cards to authenticated;
grant update (status, started_at, current_slot_id, current_round, current_card_index, turn_started_at, correct_count, skipped_count, forbidden_count, updated_at) on public.taboo_rooms to authenticated;

create or replace function public.list_taboo_slots(p_room_code text)
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
  from public.taboo_rooms r
  join public.taboo_room_slots s on s.room_id = r.id
  where r.room_code = upper(trim(p_room_code))
    and r.status = 'waiting'
    and (select auth.uid()) is not null
  order by s.position;
$$;

revoke all on function public.list_taboo_slots(text) from public, anon;
grant execute on function public.list_taboo_slots(text) to authenticated;

create or replace function public.create_taboo_room(
  p_mode text,
  p_slot_names text[],
  p_cards jsonb,
  p_turn_duration integer,
  p_rounds integer,
  p_deck_distribution text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room_id uuid;
  v_room_code text;
  v_slot_id uuid;
  v_position integer := 0;
  v_card jsonb;
  v_card_index integer;
  v_slot_cards jsonb;
begin
  if (select auth.uid()) is null then raise exception 'UNAUTHORIZED'; end if;
  if p_mode not in ('individual', 'team') then raise exception 'INVALID_MODE'; end if;
  if p_deck_distribution not in ('shared', 'split') then raise exception 'INVALID_DECK_DISTRIBUTION'; end if;
  if p_turn_duration not between 1 and 3600 then raise exception 'INVALID_TURN_DURATION'; end if;
  if p_rounds not between 1 and 20 then raise exception 'INVALID_ROUNDS'; end if;
  if coalesce(array_length(p_slot_names, 1), 0) not between 1 and 8 then raise exception 'INVALID_SLOTS'; end if;
  if jsonb_typeof(p_cards) <> 'array' or jsonb_array_length(p_cards) < 1 then raise exception 'INVALID_CARDS'; end if;
  if p_deck_distribution = 'split'
    and jsonb_array_length(p_cards) < array_length(p_slot_names, 1)
  then raise exception 'NOT_ENOUGH_CARDS_PER_SLOT'; end if;

  loop
    v_room_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    exit when not exists (select 1 from public.taboo_rooms r where r.room_code = v_room_code);
  end loop;

  insert into public.taboo_rooms (
    room_code, host_id, mode, deck_distribution, turn_duration, rounds, cards
  ) values (
    v_room_code, (select auth.uid()), p_mode, p_deck_distribution,
    p_turn_duration, p_rounds, p_cards
  ) returning id into v_room_id;

  for v_position in 1..array_length(p_slot_names, 1)
  loop
    insert into public.taboo_room_slots (
      room_id, name, position, slot_type
    ) values (
      v_room_id, trim(p_slot_names[v_position]), v_position, p_mode
    ) returning id into v_slot_id;

    if p_deck_distribution = 'split' then
      v_slot_cards := '[]'::jsonb;
      v_card_index := 0;
      for v_card in select value from jsonb_array_elements(p_cards)
      loop
        if (v_card_index % array_length(p_slot_names, 1)) = (v_position - 1) then
          v_slot_cards := v_slot_cards || jsonb_build_array(v_card);
        end if;
        v_card_index := v_card_index + 1;
      end loop;
      insert into public.taboo_room_slot_cards (room_id, slot_id, cards)
      values (v_room_id, v_slot_id, v_slot_cards);
    end if;
  end loop;

  return jsonb_build_object('room_id', v_room_id, 'room_code', v_room_code);
end;
$$;

revoke all on function public.create_taboo_room(text, text[], jsonb, integer, integer, text) from public, anon;
grant execute on function public.create_taboo_room(text, text[], jsonb, integer, integer, text) to authenticated;

create or replace function public.join_taboo_room(
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
  v_room public.taboo_rooms%rowtype;
  v_slot public.taboo_room_slots%rowtype;
  v_player_id uuid;
  v_display_name text := trim(coalesce(p_player_name, '')); 
begin
  if (select auth.uid()) is null then raise exception 'UNAUTHORIZED'; end if;
  if char_length(v_display_name) not between 1 and 40 then raise exception 'INVALID_PLAYER_NAME'; end if;

  select r.* into v_room from public.taboo_rooms r
  where r.room_code = upper(trim(p_room_code)) for update;
  if not found then raise exception 'ROOM_NOT_FOUND'; end if;
  if v_room.status <> 'waiting' then raise exception 'ROOM_NOT_JOINABLE'; end if;

  select s.* into v_slot from public.taboo_room_slots s
  where s.id = p_slot_id and s.room_id = v_room.id;
  if not found then raise exception 'SLOT_NOT_FOUND'; end if;

  if v_room.mode = 'individual' and lower(v_display_name) <> lower(v_slot.name) then
    raise exception 'PLAYER_NAME_MUST_MATCH_SLOT';
  end if;
  if exists (select 1 from public.taboo_room_players p where p.room_id = v_room.id and p.user_id = (select auth.uid())) then
    raise exception 'ALREADY_JOINED';
  end if;
  if v_room.mode = 'individual' and exists (select 1 from public.taboo_room_players p where p.slot_id = v_slot.id) then
    raise exception 'SLOT_ALREADY_JOINED';
  end if;

  insert into public.taboo_room_players (
    room_id, slot_id, user_id, display_name, is_host
  ) values (
    v_room.id, v_slot.id, (select auth.uid()), v_display_name, false
  ) returning id into v_player_id;

  return jsonb_build_object(
    'room_id', v_room.id,
    'room_code', v_room.room_code,
    'player_id', v_player_id,
    'slot_id', v_slot.id
  );
end;
$$;

revoke all on function public.join_taboo_room(text, uuid, text) from public, anon;
grant execute on function public.join_taboo_room(text, uuid, text) to authenticated;

create or replace function public.get_taboo_lobby(p_room_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
stable
as $$
declare
  v_room public.taboo_rooms%rowtype;
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then raise exception 'UNAUTHORIZED'; end if;
  select r.* into v_room from public.taboo_rooms r where r.id = p_room_id;
  if not found then raise exception 'ROOM_NOT_FOUND'; end if;
  if v_room.host_id <> v_uid and not exists (
    select 1 from public.taboo_room_players p
    where p.room_id = v_room.id and p.user_id = v_uid
  ) then raise exception 'NOT_ROOM_MEMBER'; end if;

  return jsonb_build_object(
    'id', v_room.id,
    'room_code', v_room.room_code,
    'host_id', v_room.host_id,
    'is_host', v_room.host_id = v_uid,
    'mode', v_room.mode,
    'status', v_room.status,
    'deck_distribution', v_room.deck_distribution,
    'turn_duration', v_room.turn_duration,
    'rounds', v_room.rounds,
    'current_round', v_room.current_round,
    'current_slot_id', v_room.current_slot_id,
    'turn_started_at', v_room.turn_started_at,
    'correct_count', v_room.correct_count,
    'skipped_count', v_room.skipped_count,
    'forbidden_count', v_room.forbidden_count,
    'created_at', v_room.created_at,
    'started_at', v_room.started_at,
    'slots', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', s.id,
        'name', s.name,
        'position', s.position,
        'slot_type', s.slot_type,
        'score', s.score,
        'player_count', coalesce(counts.player_count, 0)
      ) order by s.position)
      from public.taboo_room_slots s
      left join (
        select p.slot_id, count(*)::integer player_count
        from public.taboo_room_players p where p.room_id = v_room.id group by p.slot_id
      ) counts on counts.slot_id = s.id
      where s.room_id = v_room.id
    ), '[]'::jsonb),
    'players', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id,
        'slot_id', p.slot_id,
        'display_name', p.display_name,
        'is_host', p.is_host
      ) order by p.joined_at)
      from public.taboo_room_players p where p.room_id = v_room.id
    ), '[]'::jsonb),
    'my_slots', coalesce((
      select jsonb_agg(p.slot_id) from public.taboo_room_players p
      where p.room_id = v_room.id and p.user_id = v_uid
    ), '[]'::jsonb)
  );
end;
$$;

revoke all on function public.get_taboo_lobby(uuid) from public, anon;
grant execute on function public.get_taboo_lobby(uuid) to authenticated;

create or replace function public.start_taboo_room(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room public.taboo_rooms%rowtype;
  v_first_slot uuid;
begin
  if (select auth.uid()) is null then raise exception 'UNAUTHORIZED'; end if;
  select r.* into v_room from public.taboo_rooms r where r.id = p_room_id for update;
  if not found then raise exception 'ROOM_NOT_FOUND'; end if;
  if v_room.host_id <> (select auth.uid()) then raise exception 'NOT_ROOM_HOST'; end if;
  if v_room.status <> 'waiting' then raise exception 'ROOM_NOT_WAITING'; end if;
  if exists (
    select 1 from public.taboo_room_slots s
    where s.room_id = v_room.id
      and not exists (select 1 from public.taboo_room_players p where p.slot_id = s.id)
  ) then raise exception 'SLOTS_NOT_READY'; end if;

  select s.id into v_first_slot from public.taboo_room_slots s
  where s.room_id = v_room.id order by s.position limit 1;

  update public.taboo_rooms
  set status = 'playing', started_at = now(), turn_started_at = now(),
      current_slot_id = v_first_slot, current_round = 1,
      current_card_index = 0, correct_count = 0, skipped_count = 0,
      forbidden_count = 0, updated_at = now()
  where id = v_room.id;
end;
$$;

revoke all on function public.start_taboo_room(uuid) from public, anon;
grant execute on function public.start_taboo_room(uuid) to authenticated;

create or replace function public.get_taboo_turn_card(p_room_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
stable
as $$
declare
  v_room public.taboo_rooms%rowtype;
  v_uid uuid := (select auth.uid());
  v_card jsonb;
  v_card_index integer;
begin
  select r.* into v_room from public.taboo_rooms r where r.id = p_room_id;
  if not found then raise exception 'ROOM_NOT_FOUND'; end if;

  if v_room.host_id <> v_uid and not exists (
    select 1 from public.taboo_room_players p
    where p.room_id = v_room.id
      and p.slot_id = v_room.current_slot_id
      and p.user_id = v_uid
  ) then raise exception 'NOT_CURRENT_PLAYER_OR_HOST'; end if;

  if v_room.deck_distribution = 'split' then
    select sc.cards, s.card_index
      into v_card, v_card_index
    from public.taboo_room_slot_cards sc
    join public.taboo_room_slots s on s.id = sc.slot_id
    where sc.room_id = v_room.id and sc.slot_id = v_room.current_slot_id;
    v_card := v_card -> (v_card_index % jsonb_array_length(v_card));
  else
    v_card_index := v_room.current_card_index;
    v_card := v_room.cards -> (v_card_index % jsonb_array_length(v_room.cards));
  end if;

  return v_card;
end;
$$;

revoke all on function public.get_taboo_turn_card(uuid) from public, anon;
grant execute on function public.get_taboo_turn_card(uuid) to authenticated;

create or replace function public.record_taboo_action(p_room_id uuid, p_action text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room public.taboo_rooms%rowtype;
  v_uid uuid := (select auth.uid());
  v_slot public.taboo_room_slots%rowtype;
begin
  if p_action not in ('correct', 'skip', 'forbidden') then raise exception 'INVALID_ACTION'; end if;
  select r.* into v_room from public.taboo_rooms r where r.id = p_room_id for update;
  if not found then raise exception 'ROOM_NOT_FOUND'; end if;
  if v_room.status <> 'playing' then raise exception 'ROOM_NOT_PLAYING'; end if;
  if v_room.host_id <> v_uid and not exists (
    select 1 from public.taboo_room_players p
    where p.room_id = v_room.id and p.slot_id = v_room.current_slot_id and p.user_id = v_uid
  ) then raise exception 'NOT_CURRENT_PLAYER_OR_HOST'; end if;

  select s.* into v_slot from public.taboo_room_slots s where s.id = v_room.current_slot_id;

  if p_action = 'correct' then
    update public.taboo_room_slots set score = score + 1 where id = v_slot.id;
    update public.taboo_rooms set correct_count = correct_count + 1 where id = v_room.id;
  elsif p_action = 'skip' then
    update public.taboo_rooms set skipped_count = skipped_count + 1 where id = v_room.id;
  else
    update public.taboo_room_slots set score = score - 1 where id = v_slot.id;
    update public.taboo_rooms set forbidden_count = forbidden_count + 1 where id = v_room.id;
  end if;

  if v_room.deck_distribution = 'split' then
    update public.taboo_room_slots set card_index = card_index + 1 where id = v_slot.id;
  else
    update public.taboo_rooms set current_card_index = current_card_index + 1 where id = v_room.id;
  end if;

  update public.taboo_rooms set updated_at = now() where id = v_room.id;
end;
$$;

revoke all on function public.record_taboo_action(uuid, text) from public, anon;
grant execute on function public.record_taboo_action(uuid, text) to authenticated;

create or replace function public.advance_taboo_turn(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room public.taboo_rooms%rowtype;
  v_next_slot uuid;
  v_next_round integer;
  v_last_position smallint;
  v_current_position smallint;
begin
  select r.* into v_room from public.taboo_rooms r where r.id = p_room_id for update;
  if not found then raise exception 'ROOM_NOT_FOUND'; end if;
  if v_room.status <> 'playing' then raise exception 'ROOM_NOT_PLAYING'; end if;
  if v_room.host_id <> (select auth.uid()) then raise exception 'NOT_ROOM_HOST'; end if;

  select s.position into v_current_position from public.taboo_room_slots s where s.id = v_room.current_slot_id;
  select max(s.position) into v_last_position from public.taboo_room_slots s where s.room_id = v_room.id;

  if v_current_position >= v_last_position then
    if v_room.current_round >= v_room.rounds then
      update public.taboo_rooms set status = 'finished', updated_at = now(), turn_started_at = null where id = v_room.id;
      return;
    end if;
    v_next_round := v_room.current_round + 1;
    select s.id into v_next_slot from public.taboo_room_slots s where s.room_id = v_room.id order by s.position limit 1;
  else
    v_next_round := v_room.current_round;
    select s.id into v_next_slot from public.taboo_room_slots s where s.room_id = v_room.id and s.position > v_current_position order by s.position limit 1;
  end if;

  update public.taboo_rooms
  set current_slot_id = v_next_slot,
      current_round = v_next_round,
      turn_started_at = now(),
      correct_count = 0,
      skipped_count = 0,
      forbidden_count = 0,
      updated_at = now()
  where id = v_room.id;
end;
$$;

revoke all on function public.advance_taboo_turn(uuid) from public, anon;
grant execute on function public.advance_taboo_turn(uuid) to authenticated;

create or replace function public.host_finish_taboo_room(p_room_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then raise exception 'UNAUTHORIZED'; end if;
  update public.taboo_rooms
  set status = 'finished', turn_started_at = null, updated_at = now()
  where id = p_room_id and host_id = (select auth.uid());
  if not found then raise exception 'NOT_ROOM_HOST'; end if;
end;
$$;

revoke all on function public.host_finish_taboo_room(uuid) from public, anon;
grant execute on function public.host_finish_taboo_room(uuid) to authenticated;
