create table if not exists public.models (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category text not null,
  vendor text,
  family text,
  parameter_size_b numeric,
  modality text,
  description text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  published_at timestamp without time zone,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now()
);

create table if not exists public.model_variants (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.models(id) on delete cascade,
  name text not null,
  precision text,
  quantization text,
  context_length integer,
  input_resolution text,
  weights_source_url text,
  notes text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  published_at timestamp without time zone,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now(),
  unique (model_id, name)
);

create table if not exists public.benchmark_scenarios (
  id uuid primary key default gen_random_uuid(),
  model_variant_id uuid not null references public.model_variants(id) on delete cascade,
  task_type text not null,
  batch_size integer,
  sequence_length integer,
  input_shape text,
  dataset text,
  framework text not null,
  runtime text,
  compiler text,
  metric_name text not null,
  metric_unit text not null,
  notes text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  published_at timestamp without time zone,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now()
);

create table if not exists public.benchmark_results (
  id uuid primary key default gen_random_uuid(),
  chip_source text not null check (chip_source in ('cloud', 'edge')),
  chip_id uuid not null,
  manufacturer_id uuid not null references public.manufacturers(id),
  scenario_id uuid not null references public.benchmark_scenarios(id) on delete cascade,
  primary_value numeric not null,
  secondary_value numeric,
  latency_ms_p50 numeric,
  latency_ms_p99 numeric,
  throughput numeric,
  power_watt numeric,
  memory_gb numeric,
  status text not null default 'draft' check (status in ('draft', 'pending_review', 'published', 'archived')),
  source_url text,
  notes text,
  created_by uuid references public.profiles(id),
  updated_by uuid references public.profiles(id),
  published_at timestamp without time zone,
  archived_at timestamp without time zone,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now()
);

create table if not exists public.benchmark_evidence (
  id uuid primary key default gen_random_uuid(),
  benchmark_result_id uuid not null references public.benchmark_results(id) on delete cascade,
  kind text not null check (kind in ('log', 'screenshot', 'report', 'command', 'repo', 'artifact')),
  file_path text not null,
  title text,
  description text,
  created_at timestamp without time zone not null default now()
);

create table if not exists public.change_requests (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  manufacturer_id uuid references public.manufacturers(id),
  requested_by uuid references public.profiles(id),
  reviewed_by uuid references public.profiles(id),
  status text not null default 'draft' check (status in ('draft', 'pending_review', 'approved', 'rejected')),
  review_notes text,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  entity_type text not null,
  entity_id uuid not null,
  action text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamp without time zone not null default now()
);

create index if not exists models_status_idx
  on public.models (status);

create index if not exists model_variants_model_id_idx
  on public.model_variants (model_id);

create index if not exists model_variants_status_idx
  on public.model_variants (status);

create index if not exists benchmark_scenarios_variant_id_idx
  on public.benchmark_scenarios (model_variant_id);

create index if not exists benchmark_scenarios_status_idx
  on public.benchmark_scenarios (status);

create index if not exists benchmark_results_chip_lookup_idx
  on public.benchmark_results (chip_source, chip_id);

create index if not exists benchmark_results_scenario_idx
  on public.benchmark_results (scenario_id);

create index if not exists benchmark_results_manufacturer_idx
  on public.benchmark_results (manufacturer_id);

create index if not exists benchmark_results_status_idx
  on public.benchmark_results (status);

create index if not exists benchmark_evidence_result_idx
  on public.benchmark_evidence (benchmark_result_id);

create index if not exists change_requests_entity_idx
  on public.change_requests (entity_type, entity_id);

create or replace function public.can_manage_benchmark_result(target_result_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.benchmark_results results
    where results.id = target_result_id
      and (
        public.is_super_admin()
        or public.can_manage_manufacturer(results.manufacturer_id)
      )
  );
$$;

create or replace function public.validate_benchmark_result_chip()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  chip_manufacturer_id uuid;
begin
  if new.chip_source = 'cloud' then
    select manufacturer_id into chip_manufacturer_id
    from public.cloud_chips
    where id = new.chip_id;
  elsif new.chip_source = 'edge' then
    select manufacturer_id into chip_manufacturer_id
    from public.edge_chips
    where id = new.chip_id;
  else
    raise exception 'unsupported chip source %', new.chip_source;
  end if;

  if chip_manufacturer_id is null then
    raise exception 'chip % for source % was not found or has no manufacturer_id', new.chip_id, new.chip_source;
  end if;

  if new.manufacturer_id <> chip_manufacturer_id then
    raise exception 'benchmark manufacturer mismatch for chip %', new.chip_id;
  end if;

  return new;
end;
$$;

drop trigger if exists models_set_updated_at on public.models;
create trigger models_set_updated_at
before update on public.models
for each row
execute function public.set_updated_at_timestamp();

drop trigger if exists model_variants_set_updated_at on public.model_variants;
create trigger model_variants_set_updated_at
before update on public.model_variants
for each row
execute function public.set_updated_at_timestamp();

drop trigger if exists benchmark_scenarios_set_updated_at on public.benchmark_scenarios;
create trigger benchmark_scenarios_set_updated_at
before update on public.benchmark_scenarios
for each row
execute function public.set_updated_at_timestamp();

drop trigger if exists benchmark_results_set_updated_at on public.benchmark_results;
create trigger benchmark_results_set_updated_at
before update on public.benchmark_results
for each row
execute function public.set_updated_at_timestamp();

drop trigger if exists change_requests_set_updated_at on public.change_requests;
create trigger change_requests_set_updated_at
before update on public.change_requests
for each row
execute function public.set_updated_at_timestamp();

drop trigger if exists benchmark_results_validate_chip on public.benchmark_results;
create trigger benchmark_results_validate_chip
before insert or update on public.benchmark_results
for each row
execute function public.validate_benchmark_result_chip();

alter table public.models enable row level security;
alter table public.model_variants enable row level security;
alter table public.benchmark_scenarios enable row level security;
alter table public.benchmark_results enable row level security;
alter table public.benchmark_evidence enable row level security;
alter table public.change_requests enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "Public read published models" on public.models;
drop policy if exists "Console read all models" on public.models;
drop policy if exists "Console write models" on public.models;

create policy "Public read published models"
  on public.models
  for select
  to anon
  using (status = 'published');

create policy "Console read all models"
  on public.models
  for select
  to authenticated
  using (true);

create policy "Console write models"
  on public.models
  for all
  to authenticated
  using (public.current_profile_role() in ('super_admin', 'vendor_editor'))
  with check (public.current_profile_role() in ('super_admin', 'vendor_editor'));

drop policy if exists "Public read published model variants" on public.model_variants;
drop policy if exists "Console read all model variants" on public.model_variants;
drop policy if exists "Console write model variants" on public.model_variants;

create policy "Public read published model variants"
  on public.model_variants
  for select
  to anon
  using (status = 'published');

create policy "Console read all model variants"
  on public.model_variants
  for select
  to authenticated
  using (true);

create policy "Console write model variants"
  on public.model_variants
  for all
  to authenticated
  using (public.current_profile_role() in ('super_admin', 'vendor_editor'))
  with check (public.current_profile_role() in ('super_admin', 'vendor_editor'));

drop policy if exists "Public read published benchmark scenarios" on public.benchmark_scenarios;
drop policy if exists "Console read all benchmark scenarios" on public.benchmark_scenarios;
drop policy if exists "Console write benchmark scenarios" on public.benchmark_scenarios;

create policy "Public read published benchmark scenarios"
  on public.benchmark_scenarios
  for select
  to anon
  using (status = 'published');

create policy "Console read all benchmark scenarios"
  on public.benchmark_scenarios
  for select
  to authenticated
  using (true);

create policy "Console write benchmark scenarios"
  on public.benchmark_scenarios
  for all
  to authenticated
  using (public.current_profile_role() in ('super_admin', 'vendor_editor'))
  with check (public.current_profile_role() in ('super_admin', 'vendor_editor'));

drop policy if exists "Public read published benchmark results" on public.benchmark_results;
drop policy if exists "Console read manageable benchmark results" on public.benchmark_results;
drop policy if exists "Console write manageable benchmark results" on public.benchmark_results;

create policy "Public read published benchmark results"
  on public.benchmark_results
  for select
  to anon
  using (status = 'published');

create policy "Console read manageable benchmark results"
  on public.benchmark_results
  for select
  to authenticated
  using (public.is_super_admin() or public.can_manage_manufacturer(manufacturer_id));

create policy "Console write manageable benchmark results"
  on public.benchmark_results
  for all
  to authenticated
  using (public.is_super_admin() or public.can_manage_manufacturer(manufacturer_id))
  with check (public.is_super_admin() or public.can_manage_manufacturer(manufacturer_id));

drop policy if exists "Public read benchmark evidence for published results" on public.benchmark_evidence;
drop policy if exists "Console read manageable benchmark evidence" on public.benchmark_evidence;
drop policy if exists "Console write manageable benchmark evidence" on public.benchmark_evidence;

create policy "Public read benchmark evidence for published results"
  on public.benchmark_evidence
  for select
  to anon
  using (
    exists (
      select 1
      from public.benchmark_results results
      where results.id = benchmark_result_id
        and results.status = 'published'
    )
  );

create policy "Console read manageable benchmark evidence"
  on public.benchmark_evidence
  for select
  to authenticated
  using (public.can_manage_benchmark_result(benchmark_result_id));

create policy "Console write manageable benchmark evidence"
  on public.benchmark_evidence
  for all
  to authenticated
  using (public.can_manage_benchmark_result(benchmark_result_id))
  with check (public.can_manage_benchmark_result(benchmark_result_id));

drop policy if exists "Admins manage change requests" on public.change_requests;
drop policy if exists "Admins read audit logs" on public.audit_logs;

create policy "Admins manage change requests"
  on public.change_requests
  for all
  to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy "Admins read audit logs"
  on public.audit_logs
  for select
  to authenticated
  using (public.is_super_admin());
