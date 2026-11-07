create table if not exists public.sentence_scramble_decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  sentences text[] not null check (cardinality(sentences) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists sentence_scramble_decks_user_id_idx
  on public.sentence_scramble_decks (user_id, updated_at desc);

alter table public.sentence_scramble_decks enable row level security;

create policy "Permanent users can read their sentence decks"
  on public.sentence_scramble_decks for select to authenticated
  using (
    (select auth.uid()) = user_id
    and coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
  );

create policy "Permanent users can create their sentence decks"
  on public.sentence_scramble_decks for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
  );

create policy "Permanent users can update their sentence decks"
  on public.sentence_scramble_decks for update to authenticated
  using (
    (select auth.uid()) = user_id
    and coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
  )
  with check (
    (select auth.uid()) = user_id
    and coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
  );

create policy "Permanent users can delete their sentence decks"
  on public.sentence_scramble_decks for delete to authenticated
  using (
    (select auth.uid()) = user_id
    and coalesce((select (auth.jwt() ->> 'is_anonymous')::boolean), false) = false
  );

grant select, insert, update, delete on public.sentence_scramble_decks to authenticated;
