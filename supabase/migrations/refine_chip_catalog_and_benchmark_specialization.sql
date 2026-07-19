create or replace view public.chips_catalog_view
with (security_invoker = true) as
select
  'cloud'::text as source,
  chips.id,
  chips.manufacturer_id,
  chips.manufacturer,
  chips.name,
  chips.category,
  chips.architecture,
  chips.process_node::text as process_node,
  chips.summary,
  chips.status,
  chips.source_url,
  chips.created_at,
  chips.updated_at,
  chips.published_at,
  chips.archived_at,
  'fp16_tflops'::text as primary_metric_key,
  'FP16 TFLOPS'::text as primary_metric_name,
  chips.fp16_tflops as primary_metric_value,
  'TFLOPS'::text as primary_metric_unit,
  chips.vram_gb as memory_capacity_gb,
  chips.tdp_watt as power_watt,
  chips.price_usd,
  chips.release_date,
  jsonb_build_object(
    'interconnect_bandwidth_gb_s', chips.interconnect_bandwidth_gb_s,
    'tensor_core_count', chips.tensor_core_count,
    'supported_precisions', chips.supported_precisions,
    'cooling_type', chips.cooling_type,
    'form_factor', chips.form_factor
  ) as spec_summary
from public.cloud_chips chips
union all
select
  'edge'::text as source,
  chips.id,
  chips.manufacturer_id,
  chips.manufacturer,
  chips.name,
  chips.category,
  null::text as architecture,
  chips.process_node::text as process_node,
  chips.summary,
  chips.status,
  chips.source_url,
  chips.created_at,
  chips.updated_at,
  chips.published_at,
  chips.archived_at,
  'ai_tops'::text as primary_metric_key,
  'AI TOPS'::text as primary_metric_name,
  chips.ai_tops as primary_metric_value,
  'TOPS'::text as primary_metric_unit,
  chips.vram_gb as memory_capacity_gb,
  chips.tdp_watt as power_watt,
  chips.price_usd,
  chips.release_date,
  jsonb_build_object(
    'process_node', chips.process_node
  ) as spec_summary
from public.edge_chips chips;

comment on view public.chips_catalog_view is
  'Unified read-only chip catalog view across cloud_chips and edge_chips.';

grant select on public.chips_catalog_view to anon, authenticated;

create table if not exists public.llm_scenario_details (
  scenario_id uuid primary key references public.benchmark_scenarios(id) on delete cascade,
  request_mode text,
  input_tokens integer,
  output_tokens integer,
  concurrency integer,
  requests_per_second_target numeric,
  prompt_template text,
  decoding_strategy text,
  notes text,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now()
);

create table if not exists public.vision_scenario_details (
  scenario_id uuid primary key references public.benchmark_scenarios(id) on delete cascade,
  task_subtype text,
  input_width integer,
  input_height integer,
  channels integer,
  video_fps numeric,
  preprocessing text,
  postprocessing text,
  notes text,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now()
);

create table if not exists public.speech_scenario_details (
  scenario_id uuid primary key references public.benchmark_scenarios(id) on delete cascade,
  task_subtype text,
  audio_duration_sec numeric,
  sample_rate_hz integer,
  streaming boolean,
  chunk_duration_ms integer,
  language text,
  decoding_strategy text,
  notes text,
  created_at timestamp without time zone not null default now(),
  updated_at timestamp without time zone not null default now()
);

comment on table public.llm_scenario_details is
  'LLM-specific benchmark scenario attributes stored one-to-one with benchmark_scenarios.';

comment on table public.vision_scenario_details is
  'Vision-specific benchmark scenario attributes stored one-to-one with benchmark_scenarios.';

comment on table public.speech_scenario_details is
  'Speech-specific benchmark scenario attributes stored one-to-one with benchmark_scenarios.';

create or replace function public.validate_specialized_scenario_category()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  expected_category text := tg_argv[0];
  actual_category text;
begin
  select models.category
  into actual_category
  from public.benchmark_scenarios scenarios
  join public.model_variants variants on variants.id = scenarios.model_variant_id
  join public.models on public.models.id = variants.model_id
  where scenarios.id = new.scenario_id;

  if actual_category is null then
    raise exception 'benchmark scenario % was not found or has no model category', new.scenario_id;
  end if;

  if actual_category <> expected_category then
    raise exception
      'scenario % belongs to model category %, expected %',
      new.scenario_id,
      actual_category,
      expected_category;
  end if;

  return new;
end;
$$;

drop trigger if exists llm_scenario_details_set_updated_at on public.llm_scenario_details;
create trigger llm_scenario_details_set_updated_at
before update on public.llm_scenario_details
for each row
execute function public.set_updated_at_timestamp();

drop trigger if exists vision_scenario_details_set_updated_at on public.vision_scenario_details;
create trigger vision_scenario_details_set_updated_at
before update on public.vision_scenario_details
for each row
execute function public.set_updated_at_timestamp();

drop trigger if exists speech_scenario_details_set_updated_at on public.speech_scenario_details;
create trigger speech_scenario_details_set_updated_at
before update on public.speech_scenario_details
for each row
execute function public.set_updated_at_timestamp();

drop trigger if exists llm_scenario_details_validate_category on public.llm_scenario_details;
create trigger llm_scenario_details_validate_category
before insert or update on public.llm_scenario_details
for each row
execute function public.validate_specialized_scenario_category('llm');

drop trigger if exists vision_scenario_details_validate_category on public.vision_scenario_details;
create trigger vision_scenario_details_validate_category
before insert or update on public.vision_scenario_details
for each row
execute function public.validate_specialized_scenario_category('vision');

drop trigger if exists speech_scenario_details_validate_category on public.speech_scenario_details;
create trigger speech_scenario_details_validate_category
before insert or update on public.speech_scenario_details
for each row
execute function public.validate_specialized_scenario_category('speech');

alter table public.llm_scenario_details enable row level security;
alter table public.vision_scenario_details enable row level security;
alter table public.speech_scenario_details enable row level security;

drop policy if exists "Public read published llm scenario details" on public.llm_scenario_details;
drop policy if exists "Console read all llm scenario details" on public.llm_scenario_details;
drop policy if exists "Console write llm scenario details" on public.llm_scenario_details;

create policy "Public read published llm scenario details"
  on public.llm_scenario_details
  for select
  to anon
  using (
    exists (
      select 1
      from public.benchmark_scenarios scenarios
      where scenarios.id = scenario_id
        and scenarios.status = 'published'
    )
  );

create policy "Console read all llm scenario details"
  on public.llm_scenario_details
  for select
  to authenticated
  using (true);

create policy "Console write llm scenario details"
  on public.llm_scenario_details
  for all
  to authenticated
  using (public.current_profile_role() in ('super_admin', 'vendor_editor'))
  with check (public.current_profile_role() in ('super_admin', 'vendor_editor'));

drop policy if exists "Public read published vision scenario details" on public.vision_scenario_details;
drop policy if exists "Console read all vision scenario details" on public.vision_scenario_details;
drop policy if exists "Console write vision scenario details" on public.vision_scenario_details;

create policy "Public read published vision scenario details"
  on public.vision_scenario_details
  for select
  to anon
  using (
    exists (
      select 1
      from public.benchmark_scenarios scenarios
      where scenarios.id = scenario_id
        and scenarios.status = 'published'
    )
  );

create policy "Console read all vision scenario details"
  on public.vision_scenario_details
  for select
  to authenticated
  using (true);

create policy "Console write vision scenario details"
  on public.vision_scenario_details
  for all
  to authenticated
  using (public.current_profile_role() in ('super_admin', 'vendor_editor'))
  with check (public.current_profile_role() in ('super_admin', 'vendor_editor'));

drop policy if exists "Public read published speech scenario details" on public.speech_scenario_details;
drop policy if exists "Console read all speech scenario details" on public.speech_scenario_details;
drop policy if exists "Console write speech scenario details" on public.speech_scenario_details;

create policy "Public read published speech scenario details"
  on public.speech_scenario_details
  for select
  to anon
  using (
    exists (
      select 1
      from public.benchmark_scenarios scenarios
      where scenarios.id = scenario_id
        and scenarios.status = 'published'
    )
  );

create policy "Console read all speech scenario details"
  on public.speech_scenario_details
  for select
  to authenticated
  using (true);

create policy "Console write speech scenario details"
  on public.speech_scenario_details
  for all
  to authenticated
  using (public.current_profile_role() in ('super_admin', 'vendor_editor'))
  with check (public.current_profile_role() in ('super_admin', 'vendor_editor'));

alter table public.benchmarks
  add column if not exists lifecycle text not null default 'legacy' check (lifecycle = 'legacy'),
  add column if not exists deprecated_at timestamp without time zone not null default now(),
  add column if not exists legacy_notes text;

update public.benchmarks
set lifecycle = 'legacy',
    deprecated_at = coalesce(deprecated_at, now()),
    legacy_notes = coalesce(
      legacy_notes,
      'Legacy compatibility table. Do not insert new benchmark data here; use benchmark_results.'
    );

comment on table public.benchmarks is
  'Legacy compatibility table. Read-only during transition; new benchmark data must go to benchmark_results.';

create or replace function public.prevent_legacy_benchmarks_write()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'public.benchmarks is legacy and read-only; use public.benchmark_results instead';
end;
$$;

drop policy if exists "Benchmarks writable by admins" on public.benchmarks;

drop trigger if exists benchmarks_block_writes on public.benchmarks;
create trigger benchmarks_block_writes
before insert or update or delete on public.benchmarks
for each row
execute function public.prevent_legacy_benchmarks_write();
