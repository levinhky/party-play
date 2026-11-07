alter policy "Room hosts can assign roles"
on public.spy_player_roles
with check (
  exists (
    select 1 from public.spy_rooms r
    where r.id = public.spy_player_roles.room_id
      and r.host_id = (select auth.uid())
      and (
        r.status = 'waiting'
        or (r.status = 'playing' and r.current_phase = 'reveal' and r.current_round = 1)
      )
  )
  and exists (
    select 1 from public.spy_room_players p
    where p.id = public.spy_player_roles.player_id
      and p.room_id = public.spy_player_roles.room_id
  )
);

create or replace function public.start_spy_room(
  p_room_id uuid,
  p_player_id uuid
)
returns public.spy_rooms
language plpgsql
security invoker
set search_path = ''
as $$
begin
  raise exception 'START_CONFIGURATION_REQUIRED';
end;
$$;
