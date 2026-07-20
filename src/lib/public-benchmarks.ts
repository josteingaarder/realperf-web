import { supabase } from '@/lib/supabase';

export type BenchmarkCategory = 'vision' | 'speech' | 'llm';
export type BenchmarkChipSource = 'cloud' | 'edge';
export type BenchmarkModelCounts = Record<BenchmarkCategory, number>;

export interface PublicBenchmarkRow {
  id: string;
  scenarioId: string;
  variantId: string | null;
  chipSource: BenchmarkChipSource;
  chipId: string;
  chipHref: string;
  chipName: string;
  chipManufacturer: string | null;
  chipCategory: string | null;
  chipPrimaryMetric: string;
  modelId: string | null;
  modelName: string;
  modelVendor: string | null;
  modelCategory: string | null;
  variantName: string;
  precision: string | null;
  quantization: string | null;
  contextLength: number | null;
  inputResolution: string | null;
  taskType: string;
  batchSize: number | null;
  sequenceLength: number | null;
  inputShape: string | null;
  dataset: string | null;
  framework: string;
  runtime: string | null;
  compiler: string | null;
  metricName: string;
  metricUnit: string;
  primaryValue: number;
  secondaryValue: number | null;
  throughput: number | null;
  latencyP50: number | null;
  latencyP99: number | null;
  powerWatt: number | null;
  memoryGb: number | null;
  sourceUrl: string | null;
  notes: string | null;
  llmRequestMode: string | null;
  llmInputTokens: number | null;
  llmOutputTokens: number | null;
  llmConcurrency: number | null;
  llmRequestsPerSecondTarget: number | null;
  llmDecodingStrategy: string | null;
  visionTaskSubtype: string | null;
  visionInputWidth: number | null;
  visionInputHeight: number | null;
  visionChannels: number | null;
  visionVideoFps: number | null;
  speechTaskSubtype: string | null;
  speechAudioDurationSec: number | null;
  speechSampleRateHz: number | null;
  speechStreaming: boolean | null;
  speechChunkDurationMs: number | null;
  speechLanguage: string | null;
  speechDecodingStrategy: string | null;
}

interface PublicBenchmarkResultQueryRow {
  id: string;
  chip_source: BenchmarkChipSource;
  chip_id: string;
  primary_value: number;
  secondary_value: number | null;
  throughput: number | null;
  latency_ms_p50: number | null;
  latency_ms_p99: number | null;
  power_watt: number | null;
  memory_gb: number | null;
  source_url: string | null;
  notes: string | null;
  scenario: PublicBenchmarkScenarioQueryRow | PublicBenchmarkScenarioQueryRow[] | null;
}

interface PublicBenchmarkScenarioQueryRow {
  id: string;
  task_type: string;
  batch_size: number | null;
  sequence_length: number | null;
  input_shape: string | null;
  dataset: string | null;
  framework: string;
  runtime: string | null;
  compiler: string | null;
  metric_name: string;
  metric_unit: string;
  llm_details: PublicLlmScenarioDetailsQueryRow | PublicLlmScenarioDetailsQueryRow[] | null;
  vision_details: PublicVisionScenarioDetailsQueryRow | PublicVisionScenarioDetailsQueryRow[] | null;
  speech_details: PublicSpeechScenarioDetailsQueryRow | PublicSpeechScenarioDetailsQueryRow[] | null;
  variant: PublicBenchmarkVariantQueryRow | PublicBenchmarkVariantQueryRow[] | null;
}

interface PublicBenchmarkVariantQueryRow {
  id: string;
  name: string;
  precision: string | null;
  quantization: string | null;
  context_length: number | null;
  input_resolution: string | null;
  model: PublicBenchmarkModelQueryRow | PublicBenchmarkModelQueryRow[] | null;
}

interface PublicBenchmarkModelQueryRow {
  id: string;
  name: string;
  vendor: string | null;
  category: string | null;
}

interface PublicLlmScenarioDetailsQueryRow {
  request_mode: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  concurrency: number | null;
  requests_per_second_target: number | null;
  decoding_strategy: string | null;
}

interface PublicVisionScenarioDetailsQueryRow {
  task_subtype: string | null;
  input_width: number | null;
  input_height: number | null;
  channels: number | null;
  video_fps: number | null;
}

interface PublicSpeechScenarioDetailsQueryRow {
  task_subtype: string | null;
  audio_duration_sec: number | null;
  sample_rate_hz: number | null;
  streaming: boolean | null;
  chunk_duration_ms: number | null;
  language: string | null;
  decoding_strategy: string | null;
}

interface PublicChipLookupRow {
  id: string;
  name: string;
  manufacturer: string | null;
  category: string | null;
  fp16_tflops?: number | null;
  ai_tops?: number | null;
}

function firstRelation<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function asBenchmarkCategory(value: string | null | undefined): BenchmarkCategory | null {
  return value === 'vision' || value === 'speech' || value === 'llm' ? value : null;
}

function formatChipPrimaryMetric(source: BenchmarkChipSource, chip: PublicChipLookupRow) {
  if (source === 'edge') {
    return chip.ai_tops == null ? '—' : `${chip.ai_tops.toLocaleString()} TOPS`;
  }

  return chip.fp16_tflops == null ? '—' : `${chip.fp16_tflops.toLocaleString()} TFLOPS`;
}

async function fetchChipMaps(rows: PublicBenchmarkResultQueryRow[]) {
  const cloudIds = [...new Set(rows.filter((row) => row.chip_source === 'cloud').map((row) => row.chip_id))];
  const edgeIds = [...new Set(rows.filter((row) => row.chip_source === 'edge').map((row) => row.chip_id))];

  const [{ data: cloudChips }, { data: edgeChips }] = await Promise.all([
    cloudIds.length > 0
      ? supabase
          .from('cloud_chips')
          .select('id,name,manufacturer,category,fp16_tflops')
          .eq('status', 'published')
          .in('id', cloudIds)
      : Promise.resolve({ data: [] }),
    edgeIds.length > 0
      ? supabase
          .from('edge_chips')
          .select('id,name,manufacturer,category,ai_tops')
          .eq('status', 'published')
          .in('id', edgeIds)
      : Promise.resolve({ data: [] }),
  ]);

  const map = new Map<string, PublicChipLookupRow>();

  for (const chip of cloudChips ?? []) {
    map.set(`cloud:${chip.id}`, chip);
  }

  for (const chip of edgeChips ?? []) {
    map.set(`edge:${chip.id}`, chip);
  }

  return map;
}

function toPublicBenchmarkRow(row: PublicBenchmarkResultQueryRow, chipMap: Map<string, PublicChipLookupRow>) {
  const scenario = firstRelation(row.scenario);
  const variant = firstRelation(scenario?.variant);
  const model = firstRelation(variant?.model);
  const llmDetails = firstRelation(scenario?.llm_details);
  const visionDetails = firstRelation(scenario?.vision_details);
  const speechDetails = firstRelation(scenario?.speech_details);
  const chip = chipMap.get(`${row.chip_source}:${row.chip_id}`);

  return {
    id: row.id,
    scenarioId: scenario?.id ?? row.id,
    variantId: variant?.id ?? null,
    chipSource: row.chip_source,
    chipId: row.chip_id,
    chipHref: row.chip_source === 'cloud' ? `/chips/${row.chip_id}` : `/edge/${row.chip_id}`,
    chipName: chip?.name ?? 'Unknown chip',
    chipManufacturer: chip?.manufacturer ?? null,
    chipCategory: chip?.category ?? null,
    chipPrimaryMetric: chip ? formatChipPrimaryMetric(row.chip_source, chip) : '—',
    modelId: model?.id ?? null,
    modelName: model?.name ?? 'Unknown model',
    modelVendor: model?.vendor ?? null,
    modelCategory: model?.category ?? null,
    variantName: variant?.name ?? 'Unnamed variant',
    precision: variant?.precision ?? null,
    quantization: variant?.quantization ?? null,
    contextLength: variant?.context_length ?? null,
    inputResolution: variant?.input_resolution ?? null,
    taskType: scenario?.task_type ?? 'Unknown task',
    batchSize: scenario?.batch_size ?? null,
    sequenceLength: scenario?.sequence_length ?? null,
    inputShape: scenario?.input_shape ?? null,
    dataset: scenario?.dataset ?? null,
    framework: scenario?.framework ?? 'Unknown framework',
    runtime: scenario?.runtime ?? null,
    compiler: scenario?.compiler ?? null,
    metricName: scenario?.metric_name ?? 'Unknown metric',
    metricUnit: scenario?.metric_unit ?? 'Unknown unit',
    primaryValue: row.primary_value,
    secondaryValue: row.secondary_value,
    throughput: row.throughput,
    latencyP50: row.latency_ms_p50,
    latencyP99: row.latency_ms_p99,
    powerWatt: row.power_watt,
    memoryGb: row.memory_gb,
    sourceUrl: row.source_url,
    notes: row.notes,
    llmRequestMode: llmDetails?.request_mode ?? null,
    llmInputTokens: llmDetails?.input_tokens ?? null,
    llmOutputTokens: llmDetails?.output_tokens ?? null,
    llmConcurrency: llmDetails?.concurrency ?? null,
    llmRequestsPerSecondTarget: llmDetails?.requests_per_second_target ?? null,
    llmDecodingStrategy: llmDetails?.decoding_strategy ?? null,
    visionTaskSubtype: visionDetails?.task_subtype ?? null,
    visionInputWidth: visionDetails?.input_width ?? null,
    visionInputHeight: visionDetails?.input_height ?? null,
    visionChannels: visionDetails?.channels ?? null,
    visionVideoFps: visionDetails?.video_fps ?? null,
    speechTaskSubtype: speechDetails?.task_subtype ?? null,
    speechAudioDurationSec: speechDetails?.audio_duration_sec ?? null,
    speechSampleRateHz: speechDetails?.sample_rate_hz ?? null,
    speechStreaming: speechDetails?.streaming ?? null,
    speechChunkDurationMs: speechDetails?.chunk_duration_ms ?? null,
    speechLanguage: speechDetails?.language ?? null,
    speechDecodingStrategy: speechDetails?.decoding_strategy ?? null,
  } satisfies PublicBenchmarkRow;
}

export async function fetchPublishedModelCountsByCategory(): Promise<BenchmarkModelCounts> {
  const counts: BenchmarkModelCounts = {
    vision: 0,
    speech: 0,
    llm: 0,
  };

  const { data } = await supabase
    .from('models')
    .select('category')
    .eq('status', 'published')
    .in('category', ['vision', 'speech', 'llm']);

  for (const model of data ?? []) {
    const category = asBenchmarkCategory(model.category);
    if (category) {
      counts[category] += 1;
    }
  }

  return counts;
}

export async function fetchPublicBenchmarkRows(category: BenchmarkCategory): Promise<PublicBenchmarkRow[]> {
  const { data } = await supabase
    .from('benchmark_results')
    .select(
      `
      id,
      chip_source,
      chip_id,
      primary_value,
      secondary_value,
      throughput,
      latency_ms_p50,
      latency_ms_p99,
      power_watt,
      memory_gb,
      source_url,
      notes,
      scenario:benchmark_scenarios (
        id,
        task_type,
        batch_size,
        sequence_length,
        input_shape,
        dataset,
        framework,
        runtime,
        compiler,
        metric_name,
        metric_unit,
        llm_details:llm_scenario_details (
          request_mode,
          input_tokens,
          output_tokens,
          concurrency,
          requests_per_second_target,
          decoding_strategy
        ),
        vision_details:vision_scenario_details (
          task_subtype,
          input_width,
          input_height,
          channels,
          video_fps
        ),
        speech_details:speech_scenario_details (
          task_subtype,
          audio_duration_sec,
          sample_rate_hz,
          streaming,
          chunk_duration_ms,
          language,
          decoding_strategy
        ),
        variant:model_variants (
          id,
          name,
          precision,
          quantization,
          context_length,
          input_resolution,
          model:models (
            id,
            name,
            vendor,
            category
          )
        )
      )
    `
    )
    .eq('status', 'published')
    .order('updated_at', { ascending: false });

  const rows = ((data ?? []) as unknown as PublicBenchmarkResultQueryRow[]).filter((row) => {
    const scenario = firstRelation(row.scenario);
    const variant = firstRelation(scenario?.variant);
    const model = firstRelation(variant?.model);
    return model?.category === category;
  });

  const chipMap = await fetchChipMaps(rows);
  return rows.map((row) => toPublicBenchmarkRow(row, chipMap));
}

export async function fetchPublicBenchmarkRowsForChip(
  source: BenchmarkChipSource,
  chipId: string
): Promise<PublicBenchmarkRow[]> {
  const { data } = await supabase
    .from('benchmark_results')
    .select(
      `
      id,
      chip_source,
      chip_id,
      primary_value,
      secondary_value,
      throughput,
      latency_ms_p50,
      latency_ms_p99,
      power_watt,
      memory_gb,
      source_url,
      notes,
      scenario:benchmark_scenarios (
        id,
        task_type,
        batch_size,
        sequence_length,
        input_shape,
        dataset,
        framework,
        runtime,
        compiler,
        metric_name,
        metric_unit,
        llm_details:llm_scenario_details (
          request_mode,
          input_tokens,
          output_tokens,
          concurrency,
          requests_per_second_target,
          decoding_strategy
        ),
        vision_details:vision_scenario_details (
          task_subtype,
          input_width,
          input_height,
          channels,
          video_fps
        ),
        speech_details:speech_scenario_details (
          task_subtype,
          audio_duration_sec,
          sample_rate_hz,
          streaming,
          chunk_duration_ms,
          language,
          decoding_strategy
        ),
        variant:model_variants (
          id,
          name,
          precision,
          quantization,
          context_length,
          input_resolution,
          model:models (
            id,
            name,
            vendor,
            category
          )
        )
      )
    `
    )
    .eq('status', 'published')
    .eq('chip_source', source)
    .eq('chip_id', chipId)
    .order('updated_at', { ascending: false });

  const rows = (data ?? []) as unknown as PublicBenchmarkResultQueryRow[];
  const chipMap = await fetchChipMaps(rows);
  return rows.map((row) => toPublicBenchmarkRow(row, chipMap));
}
