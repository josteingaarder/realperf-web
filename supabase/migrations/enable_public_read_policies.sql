alter table public.cloud_chips enable row level security;
alter table public.edge_chips enable row level security;
alter table public.benchmarks enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'cloud_chips'
      and policyname = 'Public read cloud chips'
  ) then
    create policy "Public read cloud chips"
      on public.cloud_chips
      for select
      to anon, authenticated
      using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'edge_chips'
      and policyname = 'Public read edge chips'
  ) then
    create policy "Public read edge chips"
      on public.edge_chips
      for select
      to anon, authenticated
      using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'benchmarks'
      and policyname = 'Public read benchmarks'
  ) then
    create policy "Public read benchmarks"
      on public.benchmarks
      for select
      to anon, authenticated
      using (true);
  end if;
end $$;
