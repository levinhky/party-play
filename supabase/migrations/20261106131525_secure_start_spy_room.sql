alter function public.start_spy_room(uuid, uuid) security invoker;

drop policy if exists "Room hosts can start waiting rooms" on public.spy_rooms;
create policy "Room hosts can start waiting rooms"
on public.spy_rooms
for update
to authenticated
using (
  host_id = (select auth.uid())
  and status = 'waiting'
)
with check (
  host_id = (select auth.uid())
  and status = 'playing'
  and current_phase = 'reveal'
  and current_round = 1
);

revoke update on public.spy_rooms from authenticated;
grant update (status, current_phase, current_round, updated_at)
on public.spy_rooms to authenticated;
