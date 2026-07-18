create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  role text not null default 'user' check (role in ('super_admin', 'vendor_editor', 'user')),
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now()
);

create table if not exists public.manufacturers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  website_url text,
  description text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now()
);

create table if not exists public.manufacturer_memberships (
  id uuid primary key default gen_random_uuid(),
  manufacturer_id uuid not null references public.manufacturers(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'editor' check (role in ('owner', 'editor', 'reviewer')),
  created_at timestamp without time zone not null default now(),
  unique (manufacturer_id, user_id)
);

alter table public.cloud_chips
  add column if not exists manufacturer_id uuid references public.manufacturers(id),
  add column if not exists summary text,
  add column if not exists status text not null default 'draft' check (status in ('draft', 'pending_review', 'published', 'archived')),
  add column if not exists source_url text,
  add column if not exists created_by uuid references public.profiles(id),
  add column if not exists updated_by uuid references public.profiles(id),
  add column if not exists published_at timestamp without time zone,
  add column if not exists archived_at timestamp without time zone,
  add column if not exists created_at timestamp without time zone not null default now(),
  add column if not exists updated_at timestamp without time zone not null default now();

alter table public.edge_chips
  add column if not exists manufacturer_id uuid references public.manufacturers(id),
  add column if not exists summary text,
  add column if not exists status text not null default 'draft' check (status in ('draft', 'pending_review', 'published', 'archived')),
  add column if not exists source_url text,
  add column if not exists created_by uuid references public.profiles(id),
  add column if not exists updated_by uuid references public.profiles(id),
  add column if not exists published_at timestamp without time zone,
  add column if not exists archived_at timestamp without time zone,
  add column if not exists created_at timestamp without time zone not null default now(),
  add column if not exists updated_at timestamp without time zone not null default now();

alter table public.benchmarks
  add column if not exists status text not null default 'draft' check (status in ('draft', 'pending_review', 'published', 'archived')),
  add column if not exists source_url text,
  add column if not exists created_by uuid references public.profiles(id),
  add column if not exists updated_by uuid references public.profiles(id),
  add column if not exists published_at timestamp without time zone,
  add column if not exists created_at timestamp without time zone not null default now(),
  add column if not exists updated_at timestamp without time zone not null default now();

insert into public.manufacturers (name, slug)
select manufacturer_name,
  lower(regexp_replace(manufacturer_name, '[^a-zA-Z0-9]+', '-', 'g'))
from (
  select distinct trim(manufacturer) as manufacturer_name
  from public.cloud_chips
  where manufacturer is not null and trim(manufacturer) <> ''
  union
  select distinct trim(manufacturer) as manufacturer_name
  from public.edge_chips
  where manufacturer is not null and trim(manufacturer) <> ''
) manufacturers_to_seed
on conflict (slug) do nothing;

update public.cloud_chips chips
set manufacturer_id = manufacturers.id
from public.manufacturers manufacturers
where chips.manufacturer_id is null
  and chips.manufacturer is not null
  and trim(chips.manufacturer) = manufacturers.name;

update public.edge_chips chips
set manufacturer_id = manufacturers.id
from public.manufacturers manufacturers
where chips.manufacturer_id is null
  and chips.manufacturer is not null
  and trim(chips.manufacturer) = manufacturers.name;

update public.cloud_chips
set status = 'published',
    published_at = coalesce(published_at, now())
where status = 'draft';

update public.edge_chips
set status = 'published',
    published_at = coalesce(published_at, now())
where status = 'draft';

update public.benchmarks
set status = 'published',
    published_at = coalesce(published_at, now())
where status = 'draft';

create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.current_profile_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid()),
    'user'
  );
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_profile_role() = 'super_admin';
$$;

create or replace function public.can_manage_manufacturer(target_manufacturer_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_super_admin()
    or exists (
      select 1
      from public.manufacturer_memberships memberships
      join public.profiles profiles on profiles.id = memberships.user_id
      where memberships.manufacturer_id = target_manufacturer_id
        and memberships.user_id = auth.uid()
        and profiles.role in ('super_admin', 'vendor_editor')
        and memberships.role in ('owner', 'editor')
    );
$$;

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  assigned_role text := 'user';
  derived_name text;
begin
  if not exists (
    select 1
    from public.profiles
    where role = 'super_admin'
  ) then
    assigned_role := 'super_admin';
  end if;

  derived_name := coalesce(
    new.raw_user_meta_data ->> 'display_name',
    split_part(coalesce(new.email, ''), '@', 1)
  );

  insert into public.profiles (id, email, display_name, role)
  values (new.id, new.email, nullif(derived_name, ''), assigned_role)
  on conflict (id) do update
    set email = excluded.email,
        display_name = coalesce(public.profiles.display_name, excluded.display_name);

  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at_timestamp();

drop trigger if exists manufacturers_set_updated_at on public.manufacturers;
create trigger manufacturers_set_updated_at
before update on public.manufacturers
for each row
execute function public.set_updated_at_timestamp();

drop trigger if exists cloud_chips_set_updated_at on public.cloud_chips;
create trigger cloud_chips_set_updated_at
before update on public.cloud_chips
for each row
execute function public.set_updated_at_timestamp();

drop trigger if exists edge_chips_set_updated_at on public.edge_chips;
create trigger edge_chips_set_updated_at
before update on public.edge_chips
for each row
execute function public.set_updated_at_timestamp();

drop trigger if exists benchmarks_set_updated_at on public.benchmarks;
create trigger benchmarks_set_updated_at
before update on public.benchmarks
for each row
execute function public.set_updated_at_timestamp();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user_profile();

create index if not exists cloud_chips_status_idx
  on public.cloud_chips (status);

create index if not exists cloud_chips_manufacturer_id_idx
  on public.cloud_chips (manufacturer_id);

create index if not exists edge_chips_status_idx
  on public.edge_chips (status);

create index if not exists edge_chips_manufacturer_id_idx
  on public.edge_chips (manufacturer_id);

create index if not exists benchmarks_status_idx
  on public.benchmarks (status);

alter table public.profiles enable row level security;
alter table public.manufacturers enable row level security;
alter table public.manufacturer_memberships enable row level security;

drop policy if exists "Profiles can read own row" on public.profiles;
drop policy if exists "Profiles can insert own row" on public.profiles;
drop policy if exists "Profiles can update own row" on public.profiles;

create policy "Profiles can read own row or admin"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid() or public.is_super_admin());

create policy "Profiles can insert own row or admin"
  on public.profiles
  for insert
  to authenticated
  with check (id = auth.uid() or public.is_super_admin());

create policy "Profiles can update own row or admin"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid() or public.is_super_admin())
  with check (id = auth.uid() or public.is_super_admin());

drop policy if exists "Manufacturers readable by authenticated users" on public.manufacturers;
drop policy if exists "Manufacturers manageable by admins" on public.manufacturers;

create policy "Manufacturers readable by authenticated users"
  on public.manufacturers
  for select
  to authenticated
  using (true);

create policy "Manufacturers manageable by admins"
  on public.manufacturers
  for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists "Memberships readable by owner or admin" on public.manufacturer_memberships;
drop policy if exists "Memberships manageable by admins" on public.manufacturer_memberships;

create policy "Memberships readable by owner or admin"
  on public.manufacturer_memberships
  for select
  to authenticated
  using (user_id = auth.uid() or public.is_super_admin());

create policy "Memberships manageable by admins"
  on public.manufacturer_memberships
  for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists "Public read cloud chips" on public.cloud_chips;
drop policy if exists "Public read edge chips" on public.edge_chips;
drop policy if exists "Public read benchmarks" on public.benchmarks;
drop policy if exists "Public read published cloud chips" on public.cloud_chips;
drop policy if exists "Public read published edge chips" on public.edge_chips;
drop policy if exists "Public read published benchmarks" on public.benchmarks;
drop policy if exists "Cloud chips writable by admins" on public.cloud_chips;
drop policy if exists "Cloud chips writable by manufacturers" on public.cloud_chips;
drop policy if exists "Edge chips writable by admins" on public.edge_chips;
drop policy if exists "Edge chips writable by manufacturers" on public.edge_chips;
drop policy if exists "Benchmarks writable by admins" on public.benchmarks;

create policy "Public read published cloud chips"
  on public.cloud_chips
  for select
  to anon, authenticated
  using (status = 'published');

create policy "Cloud chips writable by admins"
  on public.cloud_chips
  for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy "Cloud chips writable by manufacturers"
  on public.cloud_chips
  for all
  to authenticated
  using (manufacturer_id is not null and public.can_manage_manufacturer(manufacturer_id))
  with check (manufacturer_id is not null and public.can_manage_manufacturer(manufacturer_id));

create policy "Public read published edge chips"
  on public.edge_chips
  for select
  to anon, authenticated
  using (status = 'published');

create policy "Edge chips writable by admins"
  on public.edge_chips
  for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy "Edge chips writable by manufacturers"
  on public.edge_chips
  for all
  to authenticated
  using (manufacturer_id is not null and public.can_manage_manufacturer(manufacturer_id))
  with check (manufacturer_id is not null and public.can_manage_manufacturer(manufacturer_id));

create policy "Public read published benchmarks"
  on public.benchmarks
  for select
  to anon, authenticated
  using (status = 'published');

create policy "Benchmarks writable by admins"
  on public.benchmarks
  for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());
