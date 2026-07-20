'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { canManageManufacturer, canReviewManufacturer, requireConsoleSession } from '@/lib/console-auth';
import { fetchBenchmarkChipOptions, slugify, type BenchmarkChipOption } from '@/lib/benchmark-management';
import {
  parseBenchmarkImportCsv,
  parseOptionalBoolean,
  parseOptionalDecimal,
  parseOptionalInteger,
  parseOptionalText,
  type ParsedBenchmarkImportRow,
} from '@/lib/benchmark-import';
import {
  getOtherScenarioDetailsTables,
  getScenarioDetailsTable,
  getSpecializedBenchmarkCategory,
  normalizeBooleanLike,
  type SpecializedScenarioDetailsInput,
} from '@/lib/benchmark-scenario-details';
import { createServerSupabaseClient } from '@/lib/supabase-server';

type BenchmarkLifecycleStatus = 'draft' | 'pending_review' | 'published' | 'archived';

function asOptionalString(value: FormDataEntryValue | null) {
  const text = String(value ?? '').trim();
  return text.length > 0 ? text : null;
}

function asOptionalNumber(value: FormDataEntryValue | null) {
  const text = String(value ?? '').trim();
  if (!text) {
    return null;
  }

  const parsed = Number(text);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid numeric value: ${text}`);
  }

  return parsed;
}

function asOptionalInteger(value: FormDataEntryValue | null) {
  const parsed = asOptionalNumber(value);
  return parsed == null ? null : Math.trunc(parsed);
}

function asOptionalBoolean(value: FormDataEntryValue | null) {
  return normalizeBooleanLike(value == null ? null : String(value));
}

function revalidateBenchmarkRoutes(resultId?: string, chipSource?: 'cloud' | 'edge', chipId?: string) {
  revalidatePath('/console');
  revalidatePath('/console/benchmarks');
  revalidatePath('/console/models');
  revalidatePath('/console/review');

  if (resultId) {
    revalidatePath(`/console/benchmarks/${resultId}`);
  }

  if (chipSource && chipId) {
    revalidatePath(chipSource === 'cloud' ? `/chips/${chipId}` : `/edge/${chipId}`);
  }
}

function assertStatusTransitionAllowedForAuthoring(nextStatus: BenchmarkLifecycleStatus) {
  if (nextStatus !== 'draft' && nextStatus !== 'pending_review') {
    throw new Error('Vendor accounts can only save drafts or submit for review.');
  }
}

function assertCanReviewStatusTransition(
  currentStatus: BenchmarkLifecycleStatus,
  nextStatus: BenchmarkLifecycleStatus,
  canReview: boolean
) {
  if (!canReview) {
    assertStatusTransitionAllowedForAuthoring(nextStatus);
    return;
  }

  if (currentStatus !== 'pending_review') {
    throw new Error('Only pending review benchmark entries can be approved or sent back.');
  }

  if (nextStatus !== 'draft' && nextStatus !== 'published' && nextStatus !== 'archived') {
    throw new Error('Review actions can publish, archive, or send a benchmark entry back to draft.');
  }
}

async function resolveOrCreateModel(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  actorId: string,
  row: ParsedBenchmarkImportRow
) {
  const modelSlug = slugify(row.model_name);
  const { data: existing } = await supabase.from('models').select('id').eq('slug', modelSlug).maybeSingle();

  const payload = {
    name: row.model_name,
    slug: modelSlug,
    category: row.model_category,
    vendor: parseOptionalText(row.model_vendor),
    family: parseOptionalText(row.model_family),
    parameter_size_b: parseOptionalDecimal(row.parameter_size_b),
    modality: parseOptionalText(row.modality),
    updated_by: actorId,
  };

  if (existing) {
    const { error } = await supabase.from('models').update(payload).eq('id', existing.id);
    if (error) {
      throw new Error(error.message);
    }
    return existing.id;
  }

  const { data, error } = await supabase
    .from('models')
    .insert({
      ...payload,
      created_by: actorId,
      status: 'draft',
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to create model.');
  }

  return data.id;
}

async function resolveOrCreateVariant(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  actorId: string,
  modelId: string,
  row: ParsedBenchmarkImportRow
) {
  const payload = {
    model_id: modelId,
    name: row.variant_name,
    precision: parseOptionalText(row.precision),
    quantization: parseOptionalText(row.quantization),
    context_length: parseOptionalInteger(row.context_length),
    input_resolution: parseOptionalText(row.input_resolution),
    weights_source_url: parseOptionalText(row.weights_source_url),
    updated_by: actorId,
  };

  const { data: existing } = await supabase
    .from('model_variants')
    .select('id')
    .eq('model_id', modelId)
    .eq('name', row.variant_name)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from('model_variants').update(payload).eq('id', existing.id);
    if (error) {
      throw new Error(error.message);
    }
    return existing.id;
  }

  const { data, error } = await supabase
    .from('model_variants')
    .insert({
      ...payload,
      created_by: actorId,
      status: 'draft',
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to create model variant.');
  }

  return data.id;
}

function equalNullable(left: string | number | boolean | null | undefined, right: string | number | boolean | null | undefined) {
  return (left ?? null) === (right ?? null);
}

function firstRelation<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function buildScenarioDetailsFromImportRow(row: ParsedBenchmarkImportRow): SpecializedScenarioDetailsInput | null {
  const category = getSpecializedBenchmarkCategory(row.model_category);

  if (category === 'llm') {
    return {
      category,
      values: {
        request_mode: parseOptionalText(row.llm_request_mode),
        input_tokens: parseOptionalInteger(row.llm_input_tokens),
        output_tokens: parseOptionalInteger(row.llm_output_tokens),
        concurrency: parseOptionalInteger(row.llm_concurrency),
        requests_per_second_target: parseOptionalDecimal(row.llm_requests_per_second_target),
        prompt_template: parseOptionalText(row.llm_prompt_template),
        decoding_strategy: parseOptionalText(row.llm_decoding_strategy),
        notes: parseOptionalText(row.llm_notes),
      },
    };
  }

  if (category === 'vision') {
    return {
      category,
      values: {
        task_subtype: parseOptionalText(row.vision_task_subtype),
        input_width: parseOptionalInteger(row.vision_input_width),
        input_height: parseOptionalInteger(row.vision_input_height),
        channels: parseOptionalInteger(row.vision_channels),
        video_fps: parseOptionalDecimal(row.vision_video_fps),
        preprocessing: parseOptionalText(row.vision_preprocessing),
        postprocessing: parseOptionalText(row.vision_postprocessing),
        notes: parseOptionalText(row.vision_notes),
      },
    };
  }

  if (category === 'speech') {
    return {
      category,
      values: {
        task_subtype: parseOptionalText(row.speech_task_subtype),
        audio_duration_sec: parseOptionalDecimal(row.speech_audio_duration_sec),
        sample_rate_hz: parseOptionalInteger(row.speech_sample_rate_hz),
        streaming: parseOptionalBoolean(row.speech_streaming),
        chunk_duration_ms: parseOptionalInteger(row.speech_chunk_duration_ms),
        language: parseOptionalText(row.speech_language),
        decoding_strategy: parseOptionalText(row.speech_decoding_strategy),
        notes: parseOptionalText(row.speech_notes),
      },
    };
  }

  return null;
}

function buildScenarioDetailsFromFormData(formData: FormData, modelCategory: string): SpecializedScenarioDetailsInput | null {
  const category = getSpecializedBenchmarkCategory(modelCategory);

  if (category === 'llm') {
    return {
      category,
      values: {
        request_mode: asOptionalString(formData.get('llm_request_mode')),
        input_tokens: asOptionalInteger(formData.get('llm_input_tokens')),
        output_tokens: asOptionalInteger(formData.get('llm_output_tokens')),
        concurrency: asOptionalInteger(formData.get('llm_concurrency')),
        requests_per_second_target: asOptionalNumber(formData.get('llm_requests_per_second_target')),
        prompt_template: asOptionalString(formData.get('llm_prompt_template')),
        decoding_strategy: asOptionalString(formData.get('llm_decoding_strategy')),
        notes: asOptionalString(formData.get('llm_notes')),
      },
    };
  }

  if (category === 'vision') {
    return {
      category,
      values: {
        task_subtype: asOptionalString(formData.get('vision_task_subtype')),
        input_width: asOptionalInteger(formData.get('vision_input_width')),
        input_height: asOptionalInteger(formData.get('vision_input_height')),
        channels: asOptionalInteger(formData.get('vision_channels')),
        video_fps: asOptionalNumber(formData.get('vision_video_fps')),
        preprocessing: asOptionalString(formData.get('vision_preprocessing')),
        postprocessing: asOptionalString(formData.get('vision_postprocessing')),
        notes: asOptionalString(formData.get('vision_notes')),
      },
    };
  }

  if (category === 'speech') {
    return {
      category,
      values: {
        task_subtype: asOptionalString(formData.get('speech_task_subtype')),
        audio_duration_sec: asOptionalNumber(formData.get('speech_audio_duration_sec')),
        sample_rate_hz: asOptionalInteger(formData.get('speech_sample_rate_hz')),
        streaming: asOptionalBoolean(formData.get('speech_streaming')),
        chunk_duration_ms: asOptionalInteger(formData.get('speech_chunk_duration_ms')),
        language: asOptionalString(formData.get('speech_language')),
        decoding_strategy: asOptionalString(formData.get('speech_decoding_strategy')),
        notes: asOptionalString(formData.get('speech_notes')),
      },
    };
  }

  return null;
}

function candidateMatchesScenarioDetails(
  candidate: Record<string, unknown>,
  scenarioDetails: SpecializedScenarioDetailsInput | null
) {
  if (!scenarioDetails) {
    return (
      !firstRelation(candidate.llm_details as Record<string, unknown> | Record<string, unknown>[] | null) &&
      !firstRelation(candidate.vision_details as Record<string, unknown> | Record<string, unknown>[] | null) &&
      !firstRelation(candidate.speech_details as Record<string, unknown> | Record<string, unknown>[] | null)
    );
  }

  const relationKey = `${scenarioDetails.category}_details` as 'llm_details' | 'vision_details' | 'speech_details';
  const existingDetails = firstRelation(
    candidate[relationKey] as Record<string, unknown> | Record<string, unknown>[] | null | undefined
  );

  if (!existingDetails) {
    return false;
  }

  return Object.entries(scenarioDetails.values).every(([key, value]) =>
    equalNullable(existingDetails[key] as string | number | boolean | null | undefined, value)
  );
}

async function syncScenarioDetails(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  scenarioId: string,
  scenarioDetails: SpecializedScenarioDetailsInput | null
) {
  if (!scenarioDetails) {
    await Promise.all(
      ['llm_scenario_details', 'vision_scenario_details', 'speech_scenario_details'].map((table) =>
        supabase.from(table).delete().eq('scenario_id', scenarioId)
      )
    );
    return;
  }

  await Promise.all(
    getOtherScenarioDetailsTables(scenarioDetails.category).map((table) => supabase.from(table).delete().eq('scenario_id', scenarioId))
  );

  const table = getScenarioDetailsTable(scenarioDetails.category);
  const { error } = await supabase
    .from(table)
    .upsert(
      {
        scenario_id: scenarioId,
        ...scenarioDetails.values,
      },
      { onConflict: 'scenario_id' }
    );

  if (error) {
    throw new Error(error.message);
  }
}

async function fetchModelCategory(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  modelId: string
) {
  const { data, error } = await supabase.from('models').select('category').eq('id', modelId).single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Model not found.');
  }

  return data.category as string;
}

async function resolveOrCreateScenario(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  actorId: string,
  variantId: string,
  row: ParsedBenchmarkImportRow
) {
  const scenarioDetails = buildScenarioDetailsFromImportRow(row);
  const payload = {
    model_variant_id: variantId,
    task_type: row.task_type,
    batch_size: parseOptionalInteger(row.batch_size),
    sequence_length: parseOptionalInteger(row.sequence_length),
    input_shape: parseOptionalText(row.input_shape),
    dataset: parseOptionalText(row.dataset),
    framework: row.framework,
    runtime: parseOptionalText(row.runtime),
    compiler: parseOptionalText(row.compiler),
    metric_name: row.metric_name,
    metric_unit: row.metric_unit,
    updated_by: actorId,
  };

  const { data: candidates } = await supabase
    .from('benchmark_scenarios')
    .select(
      `
      id,
      batch_size,
      sequence_length,
      input_shape,
      dataset,
      framework,
      runtime,
      compiler,
      metric_name,
      metric_unit,
      task_type,
      llm_details:llm_scenario_details (*),
      vision_details:vision_scenario_details (*),
      speech_details:speech_scenario_details (*)
    `
    )
    .eq('model_variant_id', variantId)
    .eq('task_type', row.task_type)
    .eq('framework', row.framework)
    .eq('metric_name', row.metric_name)
    .eq('metric_unit', row.metric_unit);

  const existing = (candidates ?? []).find((candidate) => {
    return (
      equalNullable(candidate.batch_size, payload.batch_size) &&
      equalNullable(candidate.sequence_length, payload.sequence_length) &&
      equalNullable(candidate.input_shape, payload.input_shape) &&
      equalNullable(candidate.dataset, payload.dataset) &&
      equalNullable(candidate.runtime, payload.runtime) &&
      equalNullable(candidate.compiler, payload.compiler) &&
      candidateMatchesScenarioDetails(candidate as Record<string, unknown>, scenarioDetails)
    );
  });

  if (existing) {
    const { error } = await supabase.from('benchmark_scenarios').update(payload).eq('id', existing.id);
    if (error) {
      throw new Error(error.message);
    }
    await syncScenarioDetails(supabase, existing.id, scenarioDetails);
    return existing.id;
  }

  const { data, error } = await supabase
    .from('benchmark_scenarios')
    .insert({
      ...payload,
      created_by: actorId,
      status: 'draft',
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to create benchmark scenario.');
  }

  await syncScenarioDetails(supabase, data.id, scenarioDetails);
  return data.id;
}

async function upsertBenchmarkResult(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  actorId: string,
  chip: { id: string; manufacturer_id: string; source: 'cloud' | 'edge' },
  scenarioId: string,
  status: BenchmarkLifecycleStatus,
  row: ParsedBenchmarkImportRow
) {
  const payload = {
    chip_source: chip.source,
    chip_id: chip.id,
    manufacturer_id: chip.manufacturer_id,
    scenario_id: scenarioId,
    primary_value: parseOptionalDecimal(row.primary_value),
    secondary_value: parseOptionalDecimal(row.secondary_value),
    throughput: parseOptionalDecimal(row.throughput),
    latency_ms_p50: parseOptionalDecimal(row.latency_ms_p50),
    latency_ms_p99: parseOptionalDecimal(row.latency_ms_p99),
    power_watt: parseOptionalDecimal(row.power_watt),
    memory_gb: parseOptionalDecimal(row.memory_gb),
    source_url: parseOptionalText(row.source_url),
    notes: parseOptionalText(row.result_notes),
    status,
    published_at: status === 'published' ? new Date().toISOString() : null,
    archived_at: status === 'archived' ? new Date().toISOString() : null,
    updated_by: actorId,
  };

  if (payload.primary_value == null) {
    throw new Error('primary_value is required.');
  }

  const { data: existing } = await supabase
    .from('benchmark_results')
    .select('id')
    .eq('chip_source', chip.source)
    .eq('chip_id', chip.id)
    .eq('scenario_id', scenarioId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from('benchmark_results').update(payload).eq('id', existing.id);
    if (error) {
      throw new Error(error.message);
    }
    return { id: existing.id, action: 'updated' as const };
  }

  const { data, error } = await supabase
    .from('benchmark_results')
    .insert({
      ...payload,
      created_by: actorId,
    })
    .select('id')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to create benchmark result.');
  }

  return { id: data.id, action: 'created' as const };
}

async function upsertBenchmarkEvidence(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  resultId: string,
  row: ParsedBenchmarkImportRow
) {
  const filePath = parseOptionalText(row.evidence_file_path);
  if (!filePath) {
    return;
  }

  const payload = {
    benchmark_result_id: resultId,
    kind: parseOptionalText(row.evidence_kind) ?? 'artifact',
    file_path: filePath,
    title: parseOptionalText(row.evidence_title),
    description: parseOptionalText(row.evidence_description),
  };

  const { data: existing } = await supabase
    .from('benchmark_evidence')
    .select('id')
    .eq('benchmark_result_id', resultId)
    .eq('file_path', filePath)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.from('benchmark_evidence').update(payload).eq('id', existing.id);
    if (error) {
      throw new Error(error.message);
    }
    return;
  }

  const { error } = await supabase.from('benchmark_evidence').insert(payload);
  if (error) {
    throw new Error(error.message);
  }
}

function normalizeImportStatus(rawStatus: string): BenchmarkLifecycleStatus {
  const normalized = (rawStatus.trim().toLowerCase() || 'draft') as BenchmarkLifecycleStatus;
  const supportedStatuses: BenchmarkLifecycleStatus[] = ['draft', 'pending_review', 'published', 'archived'];

  if (!supportedStatuses.includes(normalized)) {
    throw new Error(`Unsupported status: ${rawStatus}`);
  }

  assertStatusTransitionAllowedForAuthoring(normalized);
  return normalized;
}

function buildChipLookupMaps(chips: BenchmarkChipOption[]) {
  const byId = new Map<string, BenchmarkChipOption>();
  const byName = new Map<string, BenchmarkChipOption>();

  for (const chip of chips) {
    byId.set(`${chip.source}:${chip.id}`, chip);
    const key = `${chip.source}:${chip.name.toLowerCase()}:${(chip.manufacturer ?? '').toLowerCase()}`;
    byName.set(key, chip);
  }

  return { byId, byName };
}

function resolveImportChip(
  row: ParsedBenchmarkImportRow,
  chipMaps: ReturnType<typeof buildChipLookupMaps>
) {
  const chipId = parseOptionalText(row.chip_id);
  const chipManufacturer = (parseOptionalText(row.chip_manufacturer) ?? '').toLowerCase();

  if (chipId) {
    const matchedById = chipMaps.byId.get(`${row.chip_source}:${chipId}`);
    if (matchedById) {
      return matchedById;
    }
  }

  const chipName = parseOptionalText(row.chip_name);
  if (!chipName) {
    throw new Error('chip_id or chip_name is required.');
  }

  const matchedByName = chipMaps.byName.get(`${row.chip_source}:${chipName.toLowerCase()}:${chipManufacturer}`);
  if (matchedByName) {
    return matchedByName;
  }

  const looseMatches = [...chipMaps.byId.values()].filter(
    (chip) =>
      chip.source === row.chip_source &&
      chip.name.toLowerCase() === chipName.toLowerCase() &&
      (!chipManufacturer || (chip.manufacturer ?? '').toLowerCase() === chipManufacturer)
  );

  if (looseMatches.length === 1) {
    return looseMatches[0];
  }

  if (looseMatches.length > 1) {
    throw new Error(`Multiple chips matched "${chipName}". Please provide chip_id.`);
  }

  throw new Error(`Chip not found for source "${row.chip_source}" and name "${chipName}".`);
}

function requireChipManufacturerId(chip: BenchmarkChipOption) {
  if (!chip.manufacturer_id) {
    throw new Error(`Chip "${chip.name}" is missing manufacturer ownership metadata.`);
  }

  return chip.manufacturer_id;
}

export async function importBenchmarksAction(formData: FormData) {
  const session = await requireConsoleSession();
  const supabase = await createServerSupabaseClient();
  const file = formData.get('csv_file');

  if (!(file instanceof File) || file.size === 0) {
    redirect('/console/benchmarks?error=Please upload a CSV file.');
  }

  try {
    const csvText = await file.text();
    const rows = parseBenchmarkImportCsv(csvText);
    const chipOptions = await fetchBenchmarkChipOptions(session);
    const chipMaps = buildChipLookupMaps(chipOptions);

    const prevalidatedRows = rows.map((row: ParsedBenchmarkImportRow) => {
      const chip = resolveImportChip(row, chipMaps);
      const status = normalizeImportStatus(row.status);
      return {
        row,
        chip,
        status,
      };
    });

    let createdCount = 0;
    let updatedCount = 0;

    for (const entry of prevalidatedRows) {
      const modelId = await resolveOrCreateModel(supabase, session.user.id, entry.row);
      const variantId = await resolveOrCreateVariant(supabase, session.user.id, modelId, entry.row);
      const scenarioId = await resolveOrCreateScenario(supabase, session.user.id, variantId, entry.row);
      const result = await upsertBenchmarkResult(
        supabase,
        session.user.id,
        {
          id: entry.chip.id,
          manufacturer_id: requireChipManufacturerId(entry.chip),
          source: entry.chip.source,
        },
        scenarioId,
        entry.status,
        entry.row
      );

      await upsertBenchmarkEvidence(supabase, result.id, entry.row);

      if (result.action === 'created') {
        createdCount += 1;
      } else {
        updatedCount += 1;
      }
    }

    revalidateBenchmarkRoutes();
    redirect(
      `/console/benchmarks?message=${encodeURIComponent(
        `Imported ${rows.length} rows. Created ${createdCount}, updated ${updatedCount}.`
      )}`
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to import benchmark CSV.';
    redirect(`/console/benchmarks?error=${encodeURIComponent(message)}`);
  }
}

async function getManagedChip(
  session: Awaited<ReturnType<typeof requireConsoleSession>>,
  chipSource: 'cloud' | 'edge',
  chipId: string
) {
  const supabase = await createServerSupabaseClient();
  const table = chipSource === 'cloud' ? 'cloud_chips' : 'edge_chips';
  const { data: chip } = await supabase
    .from(table)
    .select('id,name,manufacturer_id')
    .eq('id', chipId)
    .maybeSingle();

  if (!chip || !canManageManufacturer(session, chip.manufacturer_id)) {
    throw new Error('Chip not found or access denied.');
  }

  return chip;
}

export async function saveBenchmarkAction(formData: FormData) {
  const session = await requireConsoleSession();
  const supabase = await createServerSupabaseClient();
  const resultId = asOptionalString(formData.get('benchmark_result_id'));
  const chipSource = String(formData.get('chip_source') ?? '') as 'cloud' | 'edge';
  const chipId = String(formData.get('chip_id') ?? '');
  const modelId = String(formData.get('model_id') ?? '');

  if (!chipId || !modelId || (chipSource !== 'cloud' && chipSource !== 'edge')) {
    redirect(`/console/benchmarks${resultId ? `/${resultId}` : '/new'}?error=Chip and model are required.`);
  }

  try {
    const chip = await getManagedChip(session, chipSource, chipId);
    const modelCategory = await fetchModelCategory(supabase, modelId);

    const variantPayload = {
      model_id: modelId,
      name: String(formData.get('variant_name') ?? '').trim(),
      precision: asOptionalString(formData.get('precision')),
      quantization: asOptionalString(formData.get('quantization')),
      context_length: asOptionalInteger(formData.get('context_length')),
      input_resolution: asOptionalString(formData.get('input_resolution')),
      weights_source_url: asOptionalString(formData.get('weights_source_url')),
      notes: asOptionalString(formData.get('variant_notes')),
      status: 'draft' as const,
      updated_by: session.user.id,
    };

    if (!variantPayload.name) {
      throw new Error('Variant name is required.');
    }

    const scenarioPayload = {
      task_type: String(formData.get('task_type') ?? '').trim(),
      batch_size: asOptionalInteger(formData.get('batch_size')),
      sequence_length: asOptionalInteger(formData.get('sequence_length')),
      input_shape: asOptionalString(formData.get('input_shape')),
      dataset: asOptionalString(formData.get('dataset')),
      framework: String(formData.get('framework') ?? '').trim(),
      runtime: asOptionalString(formData.get('runtime')),
      compiler: asOptionalString(formData.get('compiler')),
      metric_name: String(formData.get('metric_name') ?? '').trim(),
      metric_unit: String(formData.get('metric_unit') ?? '').trim(),
      notes: asOptionalString(formData.get('scenario_notes')),
      status: 'draft' as const,
      updated_by: session.user.id,
    };

    if (!scenarioPayload.task_type || !scenarioPayload.framework || !scenarioPayload.metric_name || !scenarioPayload.metric_unit) {
      throw new Error('Task type, framework, metric name, and metric unit are required.');
    }

    const scenarioDetails = buildScenarioDetailsFromFormData(formData, modelCategory);

    const resultPayload = {
      chip_source: chipSource,
      chip_id: chipId,
      manufacturer_id: chip.manufacturer_id,
      primary_value: asOptionalNumber(formData.get('primary_value')),
      secondary_value: asOptionalNumber(formData.get('secondary_value')),
      latency_ms_p50: asOptionalNumber(formData.get('latency_ms_p50')),
      latency_ms_p99: asOptionalNumber(formData.get('latency_ms_p99')),
      throughput: asOptionalNumber(formData.get('throughput')),
      power_watt: asOptionalNumber(formData.get('power_watt')),
      memory_gb: asOptionalNumber(formData.get('memory_gb')),
      source_url: asOptionalString(formData.get('source_url')),
      notes: asOptionalString(formData.get('result_notes')),
      updated_by: session.user.id,
    };

    if (resultPayload.primary_value == null) {
      throw new Error('Primary result value is required.');
    }

    let variantId = asOptionalString(formData.get('variant_id'));
    let scenarioId = asOptionalString(formData.get('scenario_id'));

    if (variantId) {
      const { error } = await supabase.from('model_variants').update(variantPayload).eq('id', variantId);
      if (error) {
        throw new Error(error.message);
      }
    } else {
      const { data, error } = await supabase
        .from('model_variants')
        .insert({
          ...variantPayload,
          created_by: session.user.id,
        })
        .select('id')
        .single();

      if (error || !data) {
        throw new Error(error?.message ?? 'Failed to create model variant.');
      }

      variantId = data.id;
    }

    if (scenarioId) {
      const { error } = await supabase
        .from('benchmark_scenarios')
        .update({
          ...scenarioPayload,
          model_variant_id: variantId,
        })
        .eq('id', scenarioId);
      if (error) {
        throw new Error(error.message);
      }
    } else {
      const { data, error } = await supabase
        .from('benchmark_scenarios')
        .insert({
          ...scenarioPayload,
          model_variant_id: variantId,
          created_by: session.user.id,
        })
        .select('id')
        .single();

      if (error || !data) {
        throw new Error(error?.message ?? 'Failed to create benchmark scenario.');
      }

      scenarioId = data.id;
    }

    if (!scenarioId) {
      throw new Error('Failed to resolve benchmark scenario.');
    }

    await syncScenarioDetails(supabase, scenarioId, scenarioDetails);

    let savedResultId = resultId;

    if (resultId) {
      const { data: existing } = await supabase
        .from('benchmark_results')
        .select('id,manufacturer_id,status')
        .eq('id', resultId)
        .maybeSingle();

      if (!existing || !canManageManufacturer(session, existing.manufacturer_id)) {
        throw new Error('Benchmark result not found or access denied.');
      }

      const nextStatus = (existing.status as BenchmarkLifecycleStatus | null) ?? 'draft';
      if (session.profile.role !== 'super_admin') {
        assertStatusTransitionAllowedForAuthoring(nextStatus);
      }

      const { error } = await supabase
        .from('benchmark_results')
        .update({
          ...resultPayload,
          scenario_id: scenarioId,
        })
        .eq('id', resultId);

      if (error) {
        throw new Error(error.message);
      }
    } else {
      const { data, error } = await supabase
        .from('benchmark_results')
        .insert({
          ...resultPayload,
          scenario_id: scenarioId,
          status: 'draft',
          created_by: session.user.id,
        })
        .select('id')
        .single();

      if (error || !data) {
        throw new Error(error?.message ?? 'Failed to create benchmark result.');
      }

      savedResultId = data.id;
    }

    const evidenceId = asOptionalString(formData.get('evidence_id'));
    const evidenceFilePath = asOptionalString(formData.get('evidence_file_path'));

    if (savedResultId) {
      if (evidenceFilePath) {
        const evidencePayload = {
          benchmark_result_id: savedResultId,
          kind: String(formData.get('evidence_kind') ?? 'artifact'),
          file_path: evidenceFilePath,
          title: asOptionalString(formData.get('evidence_title')),
          description: asOptionalString(formData.get('evidence_description')),
        };

        if (evidenceId) {
          const { error } = await supabase.from('benchmark_evidence').update(evidencePayload).eq('id', evidenceId);
          if (error) {
            throw new Error(error.message);
          }
        } else {
          const { error } = await supabase.from('benchmark_evidence').insert(evidencePayload);
          if (error) {
            throw new Error(error.message);
          }
        }
      } else if (evidenceId) {
        const { error } = await supabase.from('benchmark_evidence').delete().eq('id', evidenceId);
        if (error) {
          throw new Error(error.message);
        }
      }
    }

    revalidateBenchmarkRoutes(savedResultId ?? undefined, chipSource, chipId);
    redirect(`/console/benchmarks/${savedResultId}?message=Benchmark entry saved successfully.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save benchmark entry.';
    redirect(`/console/benchmarks${resultId ? `/${resultId}` : '/new'}?error=${encodeURIComponent(message)}`);
  }
}

export async function changeBenchmarkStatusAction(formData: FormData) {
  const session = await requireConsoleSession();
  const supabase = await createServerSupabaseClient();
  const resultId = String(formData.get('benchmark_result_id') ?? '');
  const nextStatus = String(formData.get('next_status') ?? '') as BenchmarkLifecycleStatus;
  const returnTo = asOptionalString(formData.get('return_to'));

  if (!resultId) {
    redirect('/console/benchmarks?error=Missing benchmark result reference.');
  }

  try {
    const { data: existing } = await supabase
      .from('benchmark_results')
      .select('id,manufacturer_id,chip_source,chip_id,status')
      .eq('id', resultId)
      .maybeSingle();

    if (!existing) {
      throw new Error('Benchmark result not found or access denied.');
    }

    const canManage = canManageManufacturer(session, existing.manufacturer_id);
    const canReview = canReviewManufacturer(session, existing.manufacturer_id);
    const currentStatus = (existing.status as BenchmarkLifecycleStatus | null) ?? 'draft';

    if (!canManage && !canReview) {
      throw new Error('Benchmark result not found or access denied.');
    }

    if (canManage) {
      if (!canReview) {
        assertStatusTransitionAllowedForAuthoring(nextStatus);
      }
    } else {
      assertCanReviewStatusTransition(currentStatus, nextStatus, canReview);
    }

    const { error } = await supabase
      .from('benchmark_results')
      .update({
        status: nextStatus,
        published_at: nextStatus === 'published' ? new Date().toISOString() : null,
        archived_at: nextStatus === 'archived' ? new Date().toISOString() : null,
        updated_by: session.user.id,
      })
      .eq('id', resultId);

    if (error) {
      throw new Error(error.message);
    }

    revalidateBenchmarkRoutes(resultId, existing.chip_source, existing.chip_id);
    redirect(
      `${returnTo ?? `/console/benchmarks/${resultId}`}?message=${encodeURIComponent(
        `Benchmark status updated to ${nextStatus}.`
      )}`
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update benchmark status.';
    redirect(`${returnTo ?? `/console/benchmarks/${resultId}`}?error=${encodeURIComponent(message)}`);
  }
}

export async function deleteBenchmarkAction(formData: FormData) {
  const session = await requireConsoleSession();
  const supabase = await createServerSupabaseClient();
  const resultId = String(formData.get('benchmark_result_id') ?? '');

  if (!resultId) {
    redirect('/console/benchmarks?error=Missing benchmark result reference.');
  }

  try {
    const { data: existing } = await supabase
      .from('benchmark_results')
      .select('id,manufacturer_id,chip_source,chip_id')
      .eq('id', resultId)
      .maybeSingle();

    if (!existing || !canManageManufacturer(session, existing.manufacturer_id)) {
      throw new Error('Benchmark result not found or access denied.');
    }

    const { error } = await supabase.from('benchmark_results').delete().eq('id', resultId);
    if (error) {
      throw new Error(error.message);
    }

    revalidateBenchmarkRoutes(resultId, existing.chip_source, existing.chip_id);
    redirect('/console/benchmarks?message=Benchmark entry deleted successfully.');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete benchmark entry.';
    redirect(`/console/benchmarks/${resultId}?error=${encodeURIComponent(message)}`);
  }
}
