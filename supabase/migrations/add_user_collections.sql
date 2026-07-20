create table if not exists public.user_favorite_chips (
  user_id uuid not null references auth.users(id) on delete cascade,
  chip_source text not null check (chip_source in ('cloud', 'edge')),
  chip_id uuid not null,
  created_at timestamp without time zone not null default now(),
  primary key (user_id, chip_source, chip_id)
);

create index if not exists user_favorite_chips_user_idx
  on public.user_favorite_chips (user_id, created_at desc);

create table if not exists public.user_saved_comparisons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  items jsonb not null,
  names text[] not null default '{}',
  created_at timestamp without time zone not null default now(),
  check (jsonb_typeof(items) = 'array')
);

create index if not exists user_saved_comparisons_user_idx
  on public.user_saved_comparisons (user_id, created_at desc);

alter table public.user_favorite_chips enable row level security;
alter table public.user_saved_comparisons enable row level security;

drop policy if exists "Users manage own favorite chips" on public.user_favorite_chips;
create policy "Users manage own favorite chips"
  on public.user_favorite_chips
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users manage own saved comparisons" on public.user_saved_comparisons;
create policy "Users manage own saved comparisons"
  on public.user_saved_comparisons
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
