drop function if exists public.create_taboo_room(text, text[], jsonb, integer, integer, text);

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
  v_position integer;
  v_card jsonb;
  v_card_index integer;
  v_slot_cards jsonb;
begin
  if (select auth.uid()) is null then
    raise exception 'UNAUTHORIZED';
  end if;

  if p_mode not in ('individual', 'team') then
    raise exception 'INVALID_MODE';
  end if;

  if p_deck_distribution not in ('shared', 'split') then
    raise exception 'INVALID_DECK_DISTRIBUTION';
  end if;

  if p_turn_duration not between 1 and 3600 then
    raise exception 'INVALID_TURN_DURATION';
  end if;

  if p_rounds not between 1 and 20 then
    raise exception 'INVALID_ROUNDS';
  end if;

  if coalesce(array_length(p_slot_names, 1), 0) not between 1 and 20 then
    raise exception 'INVALID_SLOTS';
  end if;

  if p_mode = 'team' and array_length(p_slot_names, 1) > 10 then
    raise exception 'INVALID_SLOTS';
  end if;

  if exists (
    select 1
    from unnest(p_slot_names) name
    where char_length(trim(name)) not between 1 and 50
  ) then
    raise exception 'INVALID_SLOT_NAME';
  end if;

  if exists (
    select 1
    from unnest(p_slot_names) name
    group by lower(trim(name))
    having count(*) > 1
  ) then
    raise exception 'DUPLICATE_SLOT_NAME';
  end if;

  if jsonb_typeof(p_cards) distinct from 'array'
    or jsonb_array_length(p_cards) < 1 then
    raise exception 'INVALID_CARDS';
  end if;

  if p_deck_distribution = 'split'
    and jsonb_array_length(p_cards) < array_length(p_slot_names, 1) then
    raise exception 'NOT_ENOUGH_CARDS_PER_SLOT';
  end if;

  loop
    v_room_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    exit when not exists (
      select 1 from public.taboo_rooms r where r.room_code = v_room_code
    );
  end loop;

  insert into public.taboo_rooms (
    room_code,
    host_id,
    mode,
    deck_distribution,
    turn_duration,
    rounds,
    cards
  ) values (
    v_room_code,
    (select auth.uid()),
    p_mode,
    p_deck_distribution,
    p_turn_duration,
    p_rounds,
    p_cards
  ) returning id into v_room_id;

  for v_position in 1..array_length(p_slot_names, 1)
  loop
    insert into public.taboo_room_slots (
      room_id,
      name,
      position,
      slot_type
    ) values (
      v_room_id,
      trim(p_slot_names[v_position]),
      v_position,
      p_mode
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

  return jsonb_build_object(
    'room_id', v_room_id,
    'room_code', v_room_code
  );
end;
$$;

revoke all on function public.create_taboo_room(text, text[], jsonb, integer, integer, text) from public, anon;
grant execute on function public.create_taboo_room(text, text[], jsonb, integer, integer, text) to authenticated;

notify pgrst, 'reload schema';
