create table if not exists public.taboo_custom_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id text not null check (char_length(trim(card_id)) between 1 and 120),
  card jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, card_id)
);

create index if not exists taboo_custom_cards_user_id_idx
  on public.taboo_custom_cards (user_id, updated_at desc);

alter table public.taboo_custom_cards enable row level security;

create policy "Permanent users can read their Taboo cards"
  on public.taboo_custom_cards for select to authenticated
  using (
    (select auth.uid()) = user_id
    and coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
  );

create policy "Permanent users can insert their Taboo cards"
  on public.taboo_custom_cards for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
  );

create policy "Permanent users can update their Taboo cards"
  on public.taboo_custom_cards for update to authenticated
  using (
    (select auth.uid()) = user_id
    and coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
  )
  with check (
    (select auth.uid()) = user_id
    and coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
  );

create policy "Permanent users can delete their Taboo cards"
  on public.taboo_custom_cards for delete to authenticated
  using (
    (select auth.uid()) = user_id
    and coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
  );

grant select, insert, update, delete on public.taboo_custom_cards to authenticated;

notify pgrst, 'reload schema';
