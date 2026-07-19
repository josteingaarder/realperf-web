export const SPECIALIZED_BENCHMARK_CATEGORIES = ['llm', 'vision', 'speech'] as const;

export type SpecializedBenchmarkCategory = (typeof SPECIALIZED_BENCHMARK_CATEGORIES)[number];

export interface LlmScenarioDetailsInput {
  request_mode: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  concurrency: number | null;
  requests_per_second_target: number | null;
  prompt_template: string | null;
  decoding_strategy: string | null;
  notes: string | null;
}

export interface VisionScenarioDetailsInput {
  task_subtype: string | null;
  input_width: number | null;
  input_height: number | null;
  channels: number | null;
  video_fps: number | null;
  preprocessing: string | null;
  postprocessing: string | null;
  notes: string | null;
}

export interface SpeechScenarioDetailsInput {
  task_subtype: string | null;
  audio_duration_sec: number | null;
  sample_rate_hz: number | null;
  streaming: boolean | null;
  chunk_duration_ms: number | null;
  language: string | null;
  decoding_strategy: string | null;
  notes: string | null;
}

export type SpecializedScenarioDetailsInput =
  | { category: 'llm'; values: LlmScenarioDetailsInput }
  | { category: 'vision'; values: VisionScenarioDetailsInput }
  | { category: 'speech'; values: SpeechScenarioDetailsInput };

export function getSpecializedBenchmarkCategory(value: string | null | undefined): SpecializedBenchmarkCategory | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  return SPECIALIZED_BENCHMARK_CATEGORIES.includes(normalized as SpecializedBenchmarkCategory)
    ? (normalized as SpecializedBenchmarkCategory)
    : null;
}

export function getScenarioDetailsTable(category: SpecializedBenchmarkCategory) {
  switch (category) {
    case 'llm':
      return 'llm_scenario_details';
    case 'vision':
      return 'vision_scenario_details';
    case 'speech':
      return 'speech_scenario_details';
  }
}

export function getOtherScenarioDetailsTables(category: SpecializedBenchmarkCategory) {
  return SPECIALIZED_BENCHMARK_CATEGORIES.filter((item) => item !== category).map((item) => getScenarioDetailsTable(item));
}

export function normalizeBooleanLike(value: string | null | undefined): boolean | null {
  if (value == null) {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  if (['true', '1', 'yes', 'y', 'on'].includes(normalized)) {
    return true;
  }

  if (['false', '0', 'no', 'n', 'off'].includes(normalized)) {
    return false;
  }

  throw new Error(`Invalid boolean value: ${value}`);
}
