create table if not exists public.architecture_profiles (
  id uuid primary key default gen_random_uuid(),
  chip_source text not null check (chip_source in ('cloud', 'edge')),
  chip_id uuid not null,
  architecture_family text,
  architecture_name text,
  short_description text,
  topology_summary text,
  diagram_image_url text,
  package_type text,
  form_factor text,
  process_node text,
  cooling_type text,
  deployment_style text,
  host_attachment text,
  scale_up_interconnect text,
  memory_topology text,
  memory_bandwidth_gb_s numeric,
  thermal_notes text,
  precision_notes text,
  media_engine_notes text,
  security_notes text,
  virtualization_notes text,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  constraint architecture_profiles_chip_unique unique (chip_source, chip_id)
);

create table if not exists public.architecture_profile_sections (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.architecture_profiles(id) on delete cascade,
  title text not null,
  value text not null,
  sort_order integer not null default 0,
  created_at timestamp without time zone not null default now()
);

create table if not exists public.architecture_topology_highlights (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.architecture_profiles(id) on delete cascade,
  highlight text not null,
  sort_order integer not null default 0,
  created_at timestamp without time zone not null default now()
);

create table if not exists public.architecture_interface_groups (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.architecture_profiles(id) on delete cascade,
  title text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamp without time zone not null default now()
);

create table if not exists public.architecture_interface_items (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.architecture_interface_groups(id) on delete cascade,
  name text not null,
  definition text,
  interface_count text,
  capability text,
  protocol text,
  bandwidth_notes text,
  sort_order integer not null default 0,
  created_at timestamp without time zone not null default now()
);

create table if not exists public.architecture_pending_fields (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.architecture_profiles(id) on delete cascade,
  label text not null,
  sort_order integer not null default 0,
  created_at timestamp without time zone not null default now()
);

create index if not exists architecture_profiles_chip_lookup_idx
  on public.architecture_profiles (chip_source, chip_id);

create index if not exists architecture_profile_sections_profile_sort_idx
  on public.architecture_profile_sections (profile_id, sort_order);

create index if not exists architecture_topology_highlights_profile_sort_idx
  on public.architecture_topology_highlights (profile_id, sort_order);

create index if not exists architecture_interface_groups_profile_sort_idx
  on public.architecture_interface_groups (profile_id, sort_order);

create index if not exists architecture_interface_items_group_sort_idx
  on public.architecture_interface_items (group_id, sort_order);

create index if not exists architecture_pending_fields_profile_sort_idx
  on public.architecture_pending_fields (profile_id, sort_order);

create or replace function public.validate_architecture_profile_chip()
returns trigger
language plpgsql
as $$
begin
  if new.chip_source = 'cloud' then
    if not exists (
      select 1
      from public.cloud_chips
      where id = new.chip_id
    ) then
      raise exception 'cloud chip % does not exist', new.chip_id;
    end if;
  elsif new.chip_source = 'edge' then
    if not exists (
      select 1
      from public.edge_chips
      where id = new.chip_id
    ) then
      raise exception 'edge chip % does not exist', new.chip_id;
    end if;
  else
    raise exception 'unsupported chip source %', new.chip_source;
  end if;

  return new;
end;
$$;

create or replace function public.set_architecture_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists architecture_profiles_validate_chip on public.architecture_profiles;
create trigger architecture_profiles_validate_chip
before insert or update on public.architecture_profiles
for each row
execute function public.validate_architecture_profile_chip();

drop trigger if exists architecture_profiles_set_updated_at on public.architecture_profiles;
create trigger architecture_profiles_set_updated_at
before update on public.architecture_profiles
for each row
execute function public.set_architecture_updated_at();

alter table public.architecture_profiles enable row level security;
alter table public.architecture_profile_sections enable row level security;
alter table public.architecture_topology_highlights enable row level security;
alter table public.architecture_interface_groups enable row level security;
alter table public.architecture_interface_items enable row level security;
alter table public.architecture_pending_fields enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'architecture_profiles'
      and policyname = 'Public read architecture profiles'
  ) then
    create policy "Public read architecture profiles"
      on public.architecture_profiles
      for select
      to anon, authenticated
      using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'architecture_profile_sections'
      and policyname = 'Public read architecture profile sections'
  ) then
    create policy "Public read architecture profile sections"
      on public.architecture_profile_sections
      for select
      to anon, authenticated
      using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'architecture_topology_highlights'
      and policyname = 'Public read architecture topology highlights'
  ) then
    create policy "Public read architecture topology highlights"
      on public.architecture_topology_highlights
      for select
      to anon, authenticated
      using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'architecture_interface_groups'
      and policyname = 'Public read architecture interface groups'
  ) then
    create policy "Public read architecture interface groups"
      on public.architecture_interface_groups
      for select
      to anon, authenticated
      using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'architecture_interface_items'
      and policyname = 'Public read architecture interface items'
  ) then
    create policy "Public read architecture interface items"
      on public.architecture_interface_items
      for select
      to anon, authenticated
      using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'architecture_pending_fields'
      and policyname = 'Public read architecture pending fields'
  ) then
    create policy "Public read architecture pending fields"
      on public.architecture_pending_fields
      for select
      to anon, authenticated
      using (true);
  end if;
end $$;
