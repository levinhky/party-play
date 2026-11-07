alter table public.spy_room_players add column has_voted boolean not null default false;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.mark_spy_vote_submitted()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.spy_room_players p
  set has_voted = true
  where p.id = new.voter_id
    and p.room_id = new.room_id
    and p.user_id = (select auth.uid())
    and exists (
      select 1 from public.spy_rooms r
      where r.id = new.room_id
        and r.status = 'playing'
        and r.current_phase = 'voting'
        and r.current_round = new.round_number
    );
  return new;
end;
$$;

revoke all on function private.mark_spy_vote_submitted() from public, anon, authenticated;
create trigger mark_spy_vote_submitted
after insert or update of target_id on public.spy_votes
for each row execute function private.mark_spy_vote_submitted();

create policy "Room members can view completed ballots"
on public.spy_votes for select to authenticated
using (
  exists (
    select 1 from public.spy_rooms r
    where r.id = public.spy_votes.room_id
      and r.status = 'playing'
      and r.current_phase in ('voting', 'vote-results')
      and (select public.is_spy_room_member(r.id))
      and not exists (
        select 1 from public.spy_room_players p
        where p.room_id = r.id and not p.is_eliminated and not p.has_voted
      )
  )
);

create policy "Room members can finish voting"
on public.spy_rooms for update to authenticated
using (
  (select public.is_spy_room_member(id))
  and status = 'playing' and current_phase = 'voting'
  and not exists (
    select 1 from public.spy_room_players p
    where p.room_id = public.spy_rooms.id and not p.is_eliminated and not p.has_voted
  )
)
with check (
  (select public.is_spy_room_member(id))
  and status = 'playing' and current_phase = 'vote-results'
  and not exists (
    select 1 from public.spy_room_players p
    where p.room_id = public.spy_rooms.id and not p.is_eliminated and not p.has_voted
  )
);

create policy "Room hosts can delete completed ballots"
on public.spy_votes for delete to authenticated
using (
  exists (
    select 1 from public.spy_rooms r
    where r.id = public.spy_votes.room_id and r.host_id = (select auth.uid())
      and r.status = 'playing' and r.current_phase = 'vote-results'
  )
);
grant delete on public.spy_votes to authenticated;

create policy "Room hosts can delete completed roles"
on public.spy_player_roles for delete to authenticated
using (
  exists (
    select 1 from public.spy_rooms r
    where r.id = public.spy_player_roles.room_id and r.host_id = (select auth.uid())
      and r.status = 'playing' and r.current_phase = 'vote-results'
  )
);
grant delete on public.spy_player_roles to authenticated;

create policy "Room hosts can reset players after voting"
on public.spy_room_players for update to authenticated
using (
  exists (
    select 1 from public.spy_rooms r
    where r.id = public.spy_room_players.room_id and r.host_id = (select auth.uid())
      and r.status = 'playing' and r.current_phase = 'vote-results'
  )
)
with check (
  exists (
    select 1 from public.spy_rooms r
    where r.id = public.spy_room_players.room_id and r.host_id = (select auth.uid())
      and r.status = 'playing' and r.current_phase = 'vote-results'
  )
);
grant update (is_ready, has_voted, is_eliminated) on public.spy_room_players to authenticated;

create policy "Room hosts can replay after voting"
on public.spy_rooms for update to authenticated
using (
  host_id = (select auth.uid()) and status = 'playing' and current_phase = 'vote-results'
)
with check (
  host_id = (select auth.uid()) and status = 'waiting'
  and current_phase = 'lobby' and current_round = 0
);
grant update (status, current_phase, current_round, discussion_ends_at, updated_at)
on public.spy_rooms to authenticated;

create or replace function public.replay_spy_room(p_room_id uuid, p_player_id uuid)
returns public.spy_rooms
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_room public.spy_rooms%rowtype;
begin
  select r.* into v_room from public.spy_rooms r where r.id = p_room_id for update;
  if not found then raise exception 'ROOM_NOT_FOUND'; end if;
  if v_room.host_id <> (select auth.uid()) or not exists (
    select 1 from public.spy_room_players p
    where p.id = p_player_id and p.room_id = p_room_id
      and p.user_id = (select auth.uid()) and p.is_host = true
  ) then raise exception 'NOT_ROOM_HOST'; end if;
  if v_room.status <> 'playing' or v_room.current_phase <> 'vote-results' then
    raise exception 'ROOM_NOT_IN_RESULTS';
  end if;

  delete from public.spy_votes v where v.room_id = p_room_id;
  delete from public.spy_player_roles role_row where role_row.room_id = p_room_id;
  update public.spy_room_players p
  set is_ready = false, has_voted = false, is_eliminated = false
  where p.room_id = p_room_id;
  update public.spy_rooms r
  set status = 'waiting', current_phase = 'lobby', current_round = 0,
      discussion_ends_at = null, updated_at = now()
  where r.id = p_room_id returning r.* into v_room;
  return v_room;
end;
$$;

revoke all on function public.replay_spy_room(uuid, uuid) from public, anon;
grant execute on function public.replay_spy_room(uuid, uuid) to authenticated;
