# RealPerf Database Schema

This document defines the target database structure for RealPerf after introducing authenticated data operations, admin workflows, and benchmark ingestion. P0 only implements the authentication, role, manufacturer, and chip management subset. The remaining tables are designed here so P1 and P2 can extend the system without reworking the foundation.

## Design Principles

- Public site reads published data only.
- Authenticated console users write through controlled workflows.
- Manufacturers can manage only their own catalog entries.
- Benchmark results are modeled as reusable definitions plus measured outputs.
- Auditing and evidence are first-class entities, not afterthoughts.

## Identity And Access

### `auth.users`

Supabase-managed authentication table.

### `public.profiles`

One application profile per authenticated user.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key, matches `auth.users.id` |
| `email` | `text` | Cached email for console UX |
| `display_name` | `text` | Optional profile label |
| `role` | `text` | `super_admin`, `vendor_editor`, `user` |
| `created_at` | `timestamp` | Default `now()` |
| `updated_at` | `timestamp` | Default `now()` |

### `public.manufacturers`

Canonical manufacturer registry.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `name` | `text` | Unique |
| `slug` | `text` | Unique, URL-safe identifier |
| `website_url` | `text` | Optional |
| `description` | `text` | Optional |
| `status` | `text` | `active`, `inactive` |
| `created_at` | `timestamp` | Default `now()` |
| `updated_at` | `timestamp` | Default `now()` |

### `public.manufacturer_memberships`

Associates console users with manufacturers.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `manufacturer_id` | `uuid` | FK to `manufacturers.id` |
| `user_id` | `uuid` | FK to `profiles.id` |
| `role` | `text` | `owner`, `editor`, `reviewer` |
| `created_at` | `timestamp` | Default `now()` |

Unique key: `(manufacturer_id, user_id)`.

## Core Catalog

RealPerf keeps separate chip catalogs for cloud and edge accelerators. That structure remains in place, with governance columns added for publishing and ownership. A unified read-only view provides cross-catalog access without forcing both domains into one wide table.

### `public.cloud_chips`

Existing table extended with operational fields.

Core existing columns include:

- `id`
- `name`
- `manufacturer`
- `category`
- `architecture`
- `process_node`
- `form_factor`
- `cooling_type`
- `vram_gb`
- `vram_type`
- `interconnect_bandwidth_gb_s`
- `tensor_core_count`
- `supported_precisions`
- `tdp_watt`
- `fp16_tflops`
- `fp32_tflops`
- `release_date`
- `price_usd`

New management columns:

| Column | Type | Notes |
| --- | --- | --- |
| `manufacturer_id` | `uuid` | FK to `manufacturers.id` |
| `summary` | `text` | Short admin-maintained description |
| `status` | `text` | `draft`, `pending_review`, `published`, `archived` |
| `source_url` | `text` | Official datasheet or source |
| `created_by` | `uuid` | FK to `profiles.id` |
| `updated_by` | `uuid` | FK to `profiles.id` |
| `published_at` | `timestamp` | Set when published |
| `archived_at` | `timestamp` | Set when archived |
| `created_at` | `timestamp` | Default `now()` |
| `updated_at` | `timestamp` | Default `now()` |

### `public.edge_chips`

Existing table extended with the same management fields.

Core existing columns include:

- `id`
- `name`
- `manufacturer`
- `category`
- `process_node`
- `vram_gb`
- `tdp_watt`
- `ai_tops`
- `release_date`
- `price_usd`

New management columns mirror `cloud_chips`.

### `public.chips_catalog_view`

Read-only compatibility view across both chip catalogs.

| Column | Type | Notes |
| --- | --- | --- |
| `source` | `text` | `cloud` or `edge` |
| `id` | `uuid` | Chip identifier |
| `manufacturer_id` | `uuid` | FK to `manufacturers.id` |
| `manufacturer` | `text` | Display manufacturer |
| `name` | `text` | Chip name |
| `category` | `text` | Chip category |
| `architecture` | `text` | Present for cloud rows, null for edge rows |
| `process_node` | `text` | Normalized process node |
| `summary` | `text` | Admin summary |
| `status` | `text` | Published lifecycle state |
| `source_url` | `text` | Datasheet or source |
| `primary_metric_key` | `text` | `fp16_tflops` or `ai_tops` |
| `primary_metric_name` | `text` | Human-readable primary metric |
| `primary_metric_value` | `numeric` | Primary metric value |
| `primary_metric_unit` | `text` | `TFLOPS` or `TOPS` |
| `memory_capacity_gb` | `numeric` | Unified memory capacity |
| `power_watt` | `integer` | Unified power field |
| `price_usd` | `numeric` | Optional list price |
| `release_date` | `date` | Optional release date |
| `spec_summary` | `jsonb` | Source-specific extra attributes |

## Benchmark Domain

The current `benchmarks` table can remain for compatibility during transition, but the long-term model should use the tables below.

### `public.models`

High-level model definition.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `name` | `text` | Display name |
| `slug` | `text` | Unique |
| `category` | `text` | `vision`, `speech`, `llm`, `multimodal`, etc. |
| `vendor` | `text` | Model vendor or publisher |
| `family` | `text` | Model family |
| `parameter_size_b` | `numeric` | Optional |
| `modality` | `text` | Optional |
| `status` | `text` | `draft`, `published`, `archived` |
| `created_at` | `timestamp` | Default `now()` |
| `updated_at` | `timestamp` | Default `now()` |

### `public.model_variants`

Specific runtime-ready variant of a model.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `model_id` | `uuid` | FK to `models.id` |
| `name` | `text` | Variant label |
| `precision` | `text` | FP16, BF16, INT8, INT4, etc. |
| `quantization` | `text` | Optional |
| `context_length` | `integer` | Optional |
| `input_resolution` | `text` | Optional |
| `weights_source_url` | `text` | Optional |
| `status` | `text` | `draft`, `published`, `archived` |
| `created_at` | `timestamp` | Default `now()` |
| `updated_at` | `timestamp` | Default `now()` |

### `public.benchmark_scenarios`

Normalized test condition record.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `model_variant_id` | `uuid` | FK to `model_variants.id` |
| `task_type` | `text` | e.g. `prefill`, `decode`, `classification` |
| `batch_size` | `integer` | Optional |
| `sequence_length` | `integer` | Optional |
| `input_shape` | `text` | Resolution or shape |
| `dataset` | `text` | Optional |
| `framework` | `text` | PyTorch, TensorRT-LLM, ONNX Runtime, etc. |
| `runtime` | `text` | Optional |
| `compiler` | `text` | Optional |
| `metric_name` | `text` | Main metric name |
| `metric_unit` | `text` | tokens/s, images/s, ms, etc. |
| `notes` | `text` | Optional |
| `status` | `text` | `draft`, `published`, `archived` |
| `created_at` | `timestamp` | Default `now()` |
| `updated_at` | `timestamp` | Default `now()` |

### `public.llm_scenario_details`

LLM-specific extension record stored one-to-one with `benchmark_scenarios`.

| Column | Type | Notes |
| --- | --- | --- |
| `scenario_id` | `uuid` | PK/FK to `benchmark_scenarios.id` |
| `request_mode` | `text` | Offline, online, streaming, etc. |
| `input_tokens` | `integer` | Input token count |
| `output_tokens` | `integer` | Output token count |
| `concurrency` | `integer` | Concurrent request count |
| `requests_per_second_target` | `numeric` | Optional serving target |
| `prompt_template` | `text` | Optional prompt profile |
| `decoding_strategy` | `text` | Greedy, beam, sampling, etc. |
| `notes` | `text` | Optional |
| `created_at` | `timestamp` | Default `now()` |
| `updated_at` | `timestamp` | Default `now()` |

### `public.vision_scenario_details`

Vision-specific extension record stored one-to-one with `benchmark_scenarios`.

| Column | Type | Notes |
| --- | --- | --- |
| `scenario_id` | `uuid` | PK/FK to `benchmark_scenarios.id` |
| `task_subtype` | `text` | Classification, detection, segmentation, etc. |
| `input_width` | `integer` | Input width in pixels |
| `input_height` | `integer` | Input height in pixels |
| `channels` | `integer` | Input channel count |
| `video_fps` | `numeric` | Optional frame rate |
| `preprocessing` | `text` | Optional preprocessing notes |
| `postprocessing` | `text` | Optional postprocessing notes |
| `notes` | `text` | Optional |
| `created_at` | `timestamp` | Default `now()` |
| `updated_at` | `timestamp` | Default `now()` |

### `public.speech_scenario_details`

Speech-specific extension record stored one-to-one with `benchmark_scenarios`.

| Column | Type | Notes |
| --- | --- | --- |
| `scenario_id` | `uuid` | PK/FK to `benchmark_scenarios.id` |
| `task_subtype` | `text` | ASR, TTS, speaker ID, etc. |
| `audio_duration_sec` | `numeric` | Audio duration |
| `sample_rate_hz` | `integer` | Sample rate |
| `streaming` | `boolean` | Streaming vs offline |
| `chunk_duration_ms` | `integer` | Chunk size for streaming cases |
| `language` | `text` | Spoken language |
| `decoding_strategy` | `text` | Greedy, beam, CTC decode, etc. |
| `notes` | `text` | Optional |
| `created_at` | `timestamp` | Default `now()` |
| `updated_at` | `timestamp` | Default `now()` |

### `public.benchmark_results`

Concrete result tied to one chip and one scenario.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `chip_source` | `text` | `cloud` or `edge` |
| `chip_id` | `uuid` | FK-like reference into chip table chosen by `chip_source` |
| `manufacturer_id` | `uuid` | FK to `manufacturers.id` for access control |
| `scenario_id` | `uuid` | FK to `benchmark_scenarios.id` |
| `primary_value` | `numeric` | Main benchmark value |
| `secondary_value` | `numeric` | Optional |
| `latency_ms_p50` | `numeric` | Optional |
| `latency_ms_p99` | `numeric` | Optional |
| `throughput` | `numeric` | Optional |
| `power_watt` | `numeric` | Optional |
| `memory_gb` | `numeric` | Optional |
| `status` | `text` | `draft`, `pending_review`, `published`, `archived` |
| `source_url` | `text` | Optional source |
| `notes` | `text` | Optional |
| `created_by` | `uuid` | FK to `profiles.id` |
| `updated_by` | `uuid` | FK to `profiles.id` |
| `published_at` | `timestamp` | Optional |
| `created_at` | `timestamp` | Default `now()` |
| `updated_at` | `timestamp` | Default `now()` |

### `public.benchmark_evidence`

Supporting files and structured proof for benchmark results.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `benchmark_result_id` | `uuid` | FK to `benchmark_results.id` |
| `kind` | `text` | `log`, `screenshot`, `report`, `command`, `repo`, `artifact` |
| `file_path` | `text` | Storage path or external URL |
| `title` | `text` | Optional |
| `description` | `text` | Optional |
| `created_at` | `timestamp` | Default `now()` |

## Compatibility Layer

### `public.benchmarks`

Legacy compatibility table retained temporarily for historical reads only. No new writes should target this table:

| Column | Type | Notes |
| --- | --- | --- |
| `status` | `text` | `draft`, `pending_review`, `published`, `archived` |
| `source_url` | `text` | Optional |
| `created_by` | `uuid` | FK to `profiles.id` |
| `updated_by` | `uuid` | FK to `profiles.id` |
| `published_at` | `timestamp` | Optional |
| `created_at` | `timestamp` | Default `now()` |
| `updated_at` | `timestamp` | Default `now()` |
| `lifecycle` | `text` | Always `legacy` |
| `deprecated_at` | `timestamp` | Timestamp when legacy mode was enforced |
| `legacy_notes` | `text` | Guidance to use `benchmark_results` instead |

Operational rule: a database trigger blocks all inserts, updates, and deletes on `public.benchmarks`.

## Architecture Domain

Existing architecture tables remain valid:

- `architecture_profiles`
- `architecture_profile_sections`
- `architecture_topology_highlights`
- `architecture_interface_groups`
- `architecture_interface_items`
- `architecture_pending_fields`

Recommended next-step additions:

- add `status`
- add `created_by`
- add `updated_by`
- add `published_at`

## Tool Chain Domain

The `/tool-chain` area should eventually use normalized tables:

### `public.tool_chain_profiles`

One tool-chain profile per chip.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `chip_source` | `text` | `cloud` or `edge` |
| `chip_id` | `uuid` | Chip reference |
| `manufacturer_id` | `uuid` | FK to `manufacturers.id` |
| `status` | `text` | `draft`, `pending_review`, `published`, `archived` |
| `created_by` | `uuid` | FK to `profiles.id` |
| `updated_by` | `uuid` | FK to `profiles.id` |
| `created_at` | `timestamp` | Default `now()` |
| `updated_at` | `timestamp` | Default `now()` |

### `public.tool_chain_layers`

Framework, compiler, runtime, deployment, and integration entries.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `profile_id` | `uuid` | FK to `tool_chain_profiles.id` |
| `layer_type` | `text` | `framework`, `compiler`, `runtime`, `deployment`, `integration` |
| `title` | `text` | Display label |
| `description` | `text` | Optional |
| `sort_order` | `integer` | For rendering |
| `created_at` | `timestamp` | Default `now()` |

## Workflow And Auditing

### `public.change_requests`

Tracks submission and approval state across entities.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `entity_type` | `text` | `cloud_chip`, `edge_chip`, `benchmark_result`, etc. |
| `entity_id` | `uuid` | Related row |
| `manufacturer_id` | `uuid` | Optional FK to `manufacturers.id` |
| `requested_by` | `uuid` | FK to `profiles.id` |
| `reviewed_by` | `uuid` | FK to `profiles.id` |
| `status` | `text` | `draft`, `pending_review`, `approved`, `rejected` |
| `review_notes` | `text` | Optional |
| `created_at` | `timestamp` | Default `now()` |
| `updated_at` | `timestamp` | Default `now()` |

### `public.audit_logs`

Immutable trace of data-changing operations.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `actor_id` | `uuid` | FK to `profiles.id` |
| `entity_type` | `text` | Table or aggregate type |
| `entity_id` | `uuid` | Affected row |
| `action` | `text` | `insert`, `update`, `delete`, `publish`, `archive` |
| `payload` | `jsonb` | Sanitized change payload |
| `created_at` | `timestamp` | Default `now()` |

## Public Read Rules

The public site should only read rows where:

- `cloud_chips.status = 'published'`
- `edge_chips.status = 'published'`
- `benchmarks.status = 'published'`
- `benchmark_results.status = 'published'`
- future architecture/tool-chain rows are also restricted to `published`

## Console Write Rules

- `super_admin` can manage all rows.
- `vendor_editor` can manage rows belonging to manufacturers they are linked to.
- `user` has no write access to catalog data.
- destructive operations should still go through audit logging and, for benchmark data, ideally through review workflows.
