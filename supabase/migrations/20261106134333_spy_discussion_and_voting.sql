alter table public.spy_rooms
add column discussion_ends_at timestamptz;

create policy "Players can update their own ready state"
on public.spy_room_players
for update
to authenticated
using (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.spy_rooms r
    where r.id = public.spy_room_players.room_id
      and r.status = 'playing'
      and r.current_phase = 'reveal'
  )
)
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.spy_rooms r
    where r.id = public.spy_room_players.room_id
      and r.status = 'playing'
      and r.current_phase = 'reveal'
  )
);

revoke update on public.spy_room_players from authenticated;
grant update (is_ready) on public.spy_room_players to authenticated;

create policy "Room hosts can start discussion"
on public.spy_rooms
for update
to authenticated
using (
  host_id = (select auth.uid())
  and status = 'playing'
  and current_phase = 'reveal'
)
with check (
  host_id = (select auth.uid())
  and status = 'playing'
  and current_phase = 'discussion'
  and discussion_ends_at is not null
);

create policy "Room members can advance finished discussion"
on public.spy_rooms
for update
to authenticated
using (
  (select public.is_spy_room_member(id))
  and status = 'playing'
  and current_phase = 'discussion'
  and discussion_ends_at <= now()
)
with check (
  status = 'playing'
  and current_phase = 'voting'
  and (select public.is_spy_room_member(id))
);

create policy "Players can view their own votes"
on public.spy_votes
for select
to authenticated
using (
  exists (
    select 1 from public.spy_room_players p
    where p.id = public.spy_votes.voter_id
      and p.user_id = (select auth.uid())
  )
);

create policy "Players can cast their own votes"
on public.spy_votes
for insert
to authenticated
with check (
  exists (
    select 1 from public.spy_room_players voter
    join public.spy_rooms r on r.id = voter.room_id
    join public.spy_room_players target on target.id = public.spy_votes.target_id
    where voter.id = public.spy_votes.voter_id
      and voter.room_id = public.spy_votes.room_id
      and voter.user_id = (select auth.uid())
      and target.room_id = public.spy_votes.room_id
      and target.is_eliminated = false
      and voter.is_eliminated = false
      and r.status = 'playing'
      and r.current_phase = 'voting'
      and r.current_round = public.spy_votes.round_number
      and voter.id <> target.id
  )
);

create policy "Players can change their own vote"
on public.spy_votes
for update
to authenticated
using (
  exists (
    select 1 from public.spy_room_players p
    join public.spy_rooms r on r.id = p.room_id
    where p.id = public.spy_votes.voter_id
      and p.room_id = public.spy_votes.room_id
      and p.user_id = (select auth.uid())
      and r.status = 'playing'
      and r.current_phase = 'voting'
      and r.current_round = public.spy_votes.round_number
  )
)
with check (
  exists (
    select 1 from public.spy_room_players voter
    join public.spy_room_players target on target.id = public.spy_votes.target_id
    join public.spy_rooms r on r.id = voter.room_id
    where voter.id = public.spy_votes.voter_id
      and voter.room_id = public.spy_votes.room_id
      and voter.user_id = (select auth.uid())
      and target.room_id = public.spy_votes.room_id
      and target.is_eliminated = false
      and voter.is_eliminated = false
      and r.status = 'playing'
      and r.current_phase = 'voting'
      and r.current_round = public.spy_votes.round_number
      and voter.id <> target.id
  )
);

grant select, insert, update on public.spy_votes to authenticated;
grant update (current_phase) on public.spy_rooms to authenticated;
grant update (discussion_ends_at) on public.spy_rooms to authenticated;

create or replace function public.start_spy_discussion(
  p_room_id uuid,
  p_player_id uuid
)
returns public.spy_rooms
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_room public.spy_rooms%rowtype;
  v_player_count integer;
  v_ready_count integer;
  v_minutes integer;
begin
  select r.* into v_room
  from public.spy_rooms r
  where r.id = p_room_id
  for update;

  if not found or v_room.status <> 'playing' or v_room.current_phase <> 'reveal' then
    raise exception 'ROOM_NOT_IN_REVEAL';
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

  select count(*), count(*) filter (where p.is_ready)
  into v_player_count, v_ready_count
  from public.spy_room_players p
  where p.room_id = p_room_id;

  if v_player_count < 4 or v_ready_count <> v_player_count then
    raise exception 'PLAYERS_NOT_READY';
  end if;

  v_minutes := greatest(1, least(15, coalesce((v_room.settings ->> 'discussionMinutes')::integer, 5)));

  update public.spy_rooms r
  set current_phase = 'discussion',
      discussion_ends_at = now() + make_interval(mins => v_minutes),
      updated_at = now()
  where r.id = p_room_id
  returning r.* into v_room;

  return v_room;
end;
$$;

create or replace function public.advance_spy_discussion(
  p_room_id uuid,
  p_player_id uuid
)
returns public.spy_rooms
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_room public.spy_rooms%rowtype;
begin
  if not exists (
    select 1 from public.spy_room_players p
    where p.id = p_player_id
      and p.room_id = p_room_id
      and p.user_id = (select auth.uid())
  ) then
    raise exception 'NOT_ROOM_MEMBER';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_room_id::text, 0));

  select r.* into v_room
  from public.spy_rooms r
  where r.id = p_room_id;

  if not found then
    raise exception 'ROOM_NOT_FOUND';
  end if;

  if v_room.current_phase = 'voting' then
    return v_room;
  end if;

  if v_room.status <> 'playing'
    or v_room.current_phase <> 'discussion'
    or v_room.discussion_ends_at is null
    or v_room.discussion_ends_at > now() then
    raise exception 'DISCUSSION_NOT_FINISHED';
  end if;

  if v_room.discussion_ends_at > now() then
    raise exception 'DISCUSSION_NOT_FINISHED';
  end if;

  update public.spy_rooms r
  set current_phase = 'voting', updated_at = now()
  where r.id = p_room_id
  returning r.* into v_room;

  return v_room;
end;
$$;

create or replace function public.cast_spy_room_vote(
  p_room_id uuid,
  p_voter_id uuid,
  p_target_id uuid
)
returns public.spy_votes
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_room public.spy_rooms%rowtype;
  v_vote public.spy_votes%rowtype;
begin
  select r.* into v_room
  from public.spy_rooms r
  where r.id = p_room_id;

  if not found or v_room.status <> 'playing' or v_room.current_phase <> 'voting' then
    raise exception 'VOTING_NOT_OPEN';
  end if;

  if not exists (
    select 1 from public.spy_room_players p
    where p.id = p_voter_id
      and p.room_id = p_room_id
      and p.user_id = (select auth.uid())
      and p.is_eliminated = false
  ) then
    raise exception 'NOT_ELIGIBLE_TO_VOTE';
  end if;

  if p_target_id = p_voter_id or not exists (
    select 1 from public.spy_room_players p
    where p.id = p_target_id
      and p.room_id = p_room_id
      and p.is_eliminated = false
  ) then
    raise exception 'INVALID_VOTE_TARGET';
  end if;

  insert into public.spy_votes (room_id, round_number, voter_id, target_id)
  values (p_room_id, v_room.current_round, p_voter_id, p_target_id)
  on conflict (room_id, round_number, voter_id)
  do update set target_id = excluded.target_id
  returning * into v_vote;

  return v_vote;
end;
$$;

revoke all on function public.start_spy_discussion(uuid, uuid) from public, anon;
revoke all on function public.advance_spy_discussion(uuid, uuid) from public, anon;
revoke all on function public.cast_spy_room_vote(uuid, uuid, uuid) from public, anon;
grant execute on function public.start_spy_discussion(uuid, uuid) to authenticated;
grant execute on function public.advance_spy_discussion(uuid, uuid) to authenticated;
grant execute on function public.cast_spy_room_vote(uuid, uuid, uuid) to authenticated;
