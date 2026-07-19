'use client';

import { useMemo, useState } from 'react';
import { changeBenchmarkStatusAction, deleteBenchmarkAction, saveBenchmarkAction } from '@/app/console/benchmarks/actions';
import type { BenchmarkChipOption, ManagedModelOption } from '@/lib/benchmark-management';
import type { AppRole } from '@/lib/console-auth';
import { getSpecializedBenchmarkCategory } from '@/lib/benchmark-scenario-details';

interface BenchmarkEditorFormProps {
  benchmark?: Record<string, unknown> | null;
  chips: BenchmarkChipOption[];
  models: ManagedModelOption[];
  actorRole: AppRole;
}

function inputClassName() {
  return 'mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-500';
}

function getStatusLabel(status: unknown) {
  if (typeof status === 'string' && status.length > 0) {
    return status.replace('_', ' ');
  }

  return 'draft';
}

export default function BenchmarkEditorForm({
  benchmark,
  chips,
  models,
  actorRole,
}: BenchmarkEditorFormProps) {
  const benchmarkId = typeof benchmark?.id === 'string' ? benchmark.id : '';
  const isEditing = benchmarkId.length > 0;
  const scenario = benchmark?.scenario as Record<string, unknown> | undefined;
  const variant = scenario?.variant as Record<string, unknown> | undefined;
  const model = variant?.model as Record<string, unknown> | undefined;
  const llmDetails = scenario?.llm_details as Record<string, unknown> | undefined;
  const visionDetails = scenario?.vision_details as Record<string, unknown> | undefined;
  const speechDetails = scenario?.speech_details as Record<string, unknown> | undefined;
  const evidence = Array.isArray(benchmark?.evidence) ? (benchmark?.evidence[0] as Record<string, unknown> | undefined) : undefined;
  const initialChipSource = typeof benchmark?.chip_source === 'string' ? benchmark.chip_source : 'cloud';
  const initialChipId = typeof benchmark?.chip_id === 'string' ? benchmark.chip_id : '';
  const initialModelId = typeof model?.id === 'string' ? model.id : '';
  const [selectedChipSource, setSelectedChipSource] = useState<'cloud' | 'edge'>(
    initialChipSource === 'edge' ? 'edge' : 'cloud'
  );
  const [selectedChipId, setSelectedChipId] = useState(initialChipId);
  const [selectedModelId, setSelectedModelId] = useState(initialModelId);

  const modelsById = useMemo(() => new Map(models.map((item) => [item.id, item])), [models]);
  const selectedModelCategory = getSpecializedBenchmarkCategory(
    (selectedModelId && modelsById.get(selectedModelId)?.category) ||
      (typeof model?.category === 'string' ? model.category : null)
  );
  const filteredChips = useMemo(
    () => chips.filter((chip) => chip.source === selectedChipSource),
    [chips, selectedChipSource]
  );

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Lifecycle</div>
            <div className="mt-2 text-2xl font-semibold text-white">{getStatusLabel(benchmark?.status)}</div>
          </div>

          {isEditing ? (
            <div className="flex flex-wrap gap-3">
              <form action={changeBenchmarkStatusAction}>
                <input type="hidden" name="benchmark_result_id" value={benchmarkId} />
                <input type="hidden" name="next_status" value="draft" />
                <button
                  type="submit"
                  className="rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-white transition hover:border-emerald-500"
                >
                  Save As Draft
                </button>
              </form>
              <form action={changeBenchmarkStatusAction}>
                <input type="hidden" name="benchmark_result_id" value={benchmarkId} />
                <input type="hidden" name="next_status" value="pending_review" />
                <button
                  type="submit"
                  className="rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-200 transition hover:border-amber-400"
                >
                  Submit For Review
                </button>
              </form>
              {actorRole === 'super_admin' ? (
                <form action={changeBenchmarkStatusAction}>
                  <input type="hidden" name="benchmark_result_id" value={benchmarkId} />
                  <input type="hidden" name="next_status" value="published" />
                  <button
                    type="submit"
                    className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-emerald-400"
                  >
                    Publish
                  </button>
                </form>
              ) : null}
              {actorRole === 'super_admin' ? (
                <form action={changeBenchmarkStatusAction}>
                  <input type="hidden" name="benchmark_result_id" value={benchmarkId} />
                  <input type="hidden" name="next_status" value="archived" />
                  <button
                    type="submit"
                    className="rounded-full border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-200 transition hover:border-rose-400"
                  >
                    Archive
                  </button>
                </form>
              ) : null}
            </div>
          ) : (
            <div className="text-sm text-slate-400">New benchmark entries start as drafts.</div>
          )}
        </div>
      </div>

      <form action={saveBenchmarkAction} className="space-y-6">
        <input type="hidden" name="benchmark_result_id" value={benchmarkId} />
        <input type="hidden" name="variant_id" value={typeof variant?.id === 'string' ? variant.id : ''} />
        <input type="hidden" name="scenario_id" value={typeof scenario?.id === 'string' ? scenario.id : ''} />
        <input type="hidden" name="evidence_id" value={typeof evidence?.id === 'string' ? evidence.id : ''} />

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
            <div className="text-lg font-semibold text-white">Target Chip</div>
            <div className="mt-5 grid gap-5">
              <label className="block text-sm text-slate-300">
                Chip Type
                <select
                  name="chip_source"
                  value={selectedChipSource}
                  onChange={(event) => {
                    setSelectedChipSource(event.target.value as 'cloud' | 'edge');
                    setSelectedChipId('');
                  }}
                  className={inputClassName()}
                >
                  <option value="cloud">Cloud</option>
                  <option value="edge">Edge</option>
                </select>
              </label>
              <label className="block text-sm text-slate-300">
                Chip
                <select
                  name="chip_id"
                  value={selectedChipId}
                  onChange={(event) => setSelectedChipId(event.target.value)}
                  className={inputClassName()}
                >
                  <option value="">Select a chip</option>
                  {filteredChips.map((chip) => (
                    <option key={`${chip.source}:${chip.id}`} value={chip.id}>
                      {chip.name} ({chip.source}, {chip.manufacturer ?? 'Unknown'})
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm text-slate-300">
                Source URL
                <input
                  name="source_url"
                  type="url"
                  defaultValue={typeof benchmark?.source_url === 'string' ? benchmark.source_url : ''}
                  className={inputClassName()}
                />
              </label>
              <label className="block text-sm text-slate-300">
                Result Notes
                <textarea
                  name="result_notes"
                  rows={5}
                  defaultValue={typeof benchmark?.notes === 'string' ? benchmark.notes : ''}
                  className={inputClassName()}
                />
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
            <div className="text-lg font-semibold text-white">Model Variant</div>
            <div className="mt-5 grid gap-5">
              <label className="block text-sm text-slate-300">
                Model
                <select
                  name="model_id"
                  value={selectedModelId}
                  onChange={(event) => setSelectedModelId(event.target.value)}
                  className={inputClassName()}
                >
                  <option value="">Select a model</option>
                  {models.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.category})
                    </option>
                  ))}
                </select>
              </label>
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-300">
                Specialized scenario mode:{' '}
                <span className="font-semibold text-white">{selectedModelCategory ?? 'generic / unsupported'}</span>
              </div>
              <label className="block text-sm text-slate-300">
                Variant Name
                <input
                  name="variant_name"
                  defaultValue={typeof variant?.name === 'string' ? variant.name : ''}
                  className={inputClassName()}
                />
              </label>
              <label className="block text-sm text-slate-300">
                Precision
                <input
                  name="precision"
                  defaultValue={typeof variant?.precision === 'string' ? variant.precision : ''}
                  className={inputClassName()}
                />
              </label>
              <label className="block text-sm text-slate-300">
                Quantization
                <input
                  name="quantization"
                  defaultValue={typeof variant?.quantization === 'string' ? variant.quantization : ''}
                  className={inputClassName()}
                />
              </label>
              <label className="block text-sm text-slate-300">
                Context Length
                <input
                  name="context_length"
                  inputMode="numeric"
                  defaultValue={variant?.context_length == null ? '' : String(variant.context_length)}
                  className={inputClassName()}
                />
              </label>
              <label className="block text-sm text-slate-300">
                Input Resolution
                <input
                  name="input_resolution"
                  defaultValue={typeof variant?.input_resolution === 'string' ? variant.input_resolution : ''}
                  className={inputClassName()}
                />
              </label>
              <label className="block text-sm text-slate-300">
                Weights Source URL
                <input
                  name="weights_source_url"
                  type="url"
                  defaultValue={typeof variant?.weights_source_url === 'string' ? variant.weights_source_url : ''}
                  className={inputClassName()}
                />
              </label>
              <label className="block text-sm text-slate-300">
                Variant Notes
                <textarea
                  name="variant_notes"
                  rows={4}
                  defaultValue={typeof variant?.notes === 'string' ? variant.notes : ''}
                  className={inputClassName()}
                />
              </label>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
            <div className="text-lg font-semibold text-white">Benchmark Scenario</div>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <label className="block text-sm text-slate-300">
                Task Type
                <input
                  name="task_type"
                  defaultValue={typeof scenario?.task_type === 'string' ? scenario.task_type : ''}
                  className={inputClassName()}
                />
              </label>
              <label className="block text-sm text-slate-300">
                Framework
                <input
                  name="framework"
                  defaultValue={typeof scenario?.framework === 'string' ? scenario.framework : ''}
                  className={inputClassName()}
                />
              </label>
              <label className="block text-sm text-slate-300">
                Runtime
                <input
                  name="runtime"
                  defaultValue={typeof scenario?.runtime === 'string' ? scenario.runtime : ''}
                  className={inputClassName()}
                />
              </label>
              <label className="block text-sm text-slate-300">
                Compiler
                <input
                  name="compiler"
                  defaultValue={typeof scenario?.compiler === 'string' ? scenario.compiler : ''}
                  className={inputClassName()}
                />
              </label>
              <label className="block text-sm text-slate-300">
                Batch Size
                <input
                  name="batch_size"
                  inputMode="numeric"
                  defaultValue={scenario?.batch_size == null ? '' : String(scenario.batch_size)}
                  className={inputClassName()}
                />
              </label>
              <label className="block text-sm text-slate-300">
                Sequence Length
                <input
                  name="sequence_length"
                  inputMode="numeric"
                  defaultValue={scenario?.sequence_length == null ? '' : String(scenario.sequence_length)}
                  className={inputClassName()}
                />
              </label>
              <label className="block text-sm text-slate-300">
                Input Shape
                <input
                  name="input_shape"
                  defaultValue={typeof scenario?.input_shape === 'string' ? scenario.input_shape : ''}
                  className={inputClassName()}
                />
              </label>
              <label className="block text-sm text-slate-300">
                Dataset
                <input
                  name="dataset"
                  defaultValue={typeof scenario?.dataset === 'string' ? scenario.dataset : ''}
                  className={inputClassName()}
                />
              </label>
              <label className="block text-sm text-slate-300">
                Metric Name
                <input
                  name="metric_name"
                  defaultValue={typeof scenario?.metric_name === 'string' ? scenario.metric_name : ''}
                  className={inputClassName()}
                />
              </label>
              <label className="block text-sm text-slate-300">
                Metric Unit
                <input
                  name="metric_unit"
                  defaultValue={typeof scenario?.metric_unit === 'string' ? scenario.metric_unit : ''}
                  className={inputClassName()}
                />
              </label>
              <label className="block text-sm text-slate-300 md:col-span-2">
                Scenario Notes
                <textarea
                  name="scenario_notes"
                  rows={4}
                  defaultValue={typeof scenario?.notes === 'string' ? scenario.notes : ''}
                  className={inputClassName()}
                />
              </label>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Specialized Scenario Details</div>
              <div className="mt-4">
                {selectedModelCategory === 'llm' ? (
                  <ScenarioDetailsGrid>
                    <Field label="Request Mode">
                      <input
                        name="llm_request_mode"
                        defaultValue={typeof llmDetails?.request_mode === 'string' ? llmDetails.request_mode : ''}
                        className={inputClassName()}
                      />
                    </Field>
                    <Field label="Input Tokens">
                      <input
                        name="llm_input_tokens"
                        inputMode="numeric"
                        defaultValue={llmDetails?.input_tokens == null ? '' : String(llmDetails.input_tokens)}
                        className={inputClassName()}
                      />
                    </Field>
                    <Field label="Output Tokens">
                      <input
                        name="llm_output_tokens"
                        inputMode="numeric"
                        defaultValue={llmDetails?.output_tokens == null ? '' : String(llmDetails.output_tokens)}
                        className={inputClassName()}
                      />
                    </Field>
                    <Field label="Concurrency">
                      <input
                        name="llm_concurrency"
                        inputMode="numeric"
                        defaultValue={llmDetails?.concurrency == null ? '' : String(llmDetails.concurrency)}
                        className={inputClassName()}
                      />
                    </Field>
                    <Field label="Target RPS">
                      <input
                        name="llm_requests_per_second_target"
                        inputMode="decimal"
                        defaultValue={
                          llmDetails?.requests_per_second_target == null ? '' : String(llmDetails.requests_per_second_target)
                        }
                        className={inputClassName()}
                      />
                    </Field>
                    <Field label="Decoding Strategy">
                      <input
                        name="llm_decoding_strategy"
                        defaultValue={typeof llmDetails?.decoding_strategy === 'string' ? llmDetails.decoding_strategy : ''}
                        className={inputClassName()}
                      />
                    </Field>
                    <Field label="Prompt Template" fullWidth>
                      <textarea
                        name="llm_prompt_template"
                        rows={3}
                        defaultValue={typeof llmDetails?.prompt_template === 'string' ? llmDetails.prompt_template : ''}
                        className={inputClassName()}
                      />
                    </Field>
                    <Field label="LLM Detail Notes" fullWidth>
                      <textarea
                        name="llm_notes"
                        rows={3}
                        defaultValue={typeof llmDetails?.notes === 'string' ? llmDetails.notes : ''}
                        className={inputClassName()}
                      />
                    </Field>
                  </ScenarioDetailsGrid>
                ) : null}

                {selectedModelCategory === 'vision' ? (
                  <ScenarioDetailsGrid>
                    <Field label="Task Subtype">
                      <input
                        name="vision_task_subtype"
                        defaultValue={typeof visionDetails?.task_subtype === 'string' ? visionDetails.task_subtype : ''}
                        className={inputClassName()}
                      />
                    </Field>
                    <Field label="Input Width">
                      <input
                        name="vision_input_width"
                        inputMode="numeric"
                        defaultValue={visionDetails?.input_width == null ? '' : String(visionDetails.input_width)}
                        className={inputClassName()}
                      />
                    </Field>
                    <Field label="Input Height">
                      <input
                        name="vision_input_height"
                        inputMode="numeric"
                        defaultValue={visionDetails?.input_height == null ? '' : String(visionDetails.input_height)}
                        className={inputClassName()}
                      />
                    </Field>
                    <Field label="Channels">
                      <input
                        name="vision_channels"
                        inputMode="numeric"
                        defaultValue={visionDetails?.channels == null ? '' : String(visionDetails.channels)}
                        className={inputClassName()}
                      />
                    </Field>
                    <Field label="Video FPS">
                      <input
                        name="vision_video_fps"
                        inputMode="decimal"
                        defaultValue={visionDetails?.video_fps == null ? '' : String(visionDetails.video_fps)}
                        className={inputClassName()}
                      />
                    </Field>
                    <Field label="Preprocessing">
                      <input
                        name="vision_preprocessing"
                        defaultValue={typeof visionDetails?.preprocessing === 'string' ? visionDetails.preprocessing : ''}
                        className={inputClassName()}
                      />
                    </Field>
                    <Field label="Postprocessing">
                      <input
                        name="vision_postprocessing"
                        defaultValue={typeof visionDetails?.postprocessing === 'string' ? visionDetails.postprocessing : ''}
                        className={inputClassName()}
                      />
                    </Field>
                    <Field label="Vision Detail Notes" fullWidth>
                      <textarea
                        name="vision_notes"
                        rows={3}
                        defaultValue={typeof visionDetails?.notes === 'string' ? visionDetails.notes : ''}
                        className={inputClassName()}
                      />
                    </Field>
                  </ScenarioDetailsGrid>
                ) : null}

                {selectedModelCategory === 'speech' ? (
                  <ScenarioDetailsGrid>
                    <Field label="Task Subtype">
                      <input
                        name="speech_task_subtype"
                        defaultValue={typeof speechDetails?.task_subtype === 'string' ? speechDetails.task_subtype : ''}
                        className={inputClassName()}
                      />
                    </Field>
                    <Field label="Audio Duration (s)">
                      <input
                        name="speech_audio_duration_sec"
                        inputMode="decimal"
                        defaultValue={speechDetails?.audio_duration_sec == null ? '' : String(speechDetails.audio_duration_sec)}
                        className={inputClassName()}
                      />
                    </Field>
                    <Field label="Sample Rate (Hz)">
                      <input
                        name="speech_sample_rate_hz"
                        inputMode="numeric"
                        defaultValue={speechDetails?.sample_rate_hz == null ? '' : String(speechDetails.sample_rate_hz)}
                        className={inputClassName()}
                      />
                    </Field>
                    <Field label="Streaming">
                      <select
                        name="speech_streaming"
                        defaultValue={
                          speechDetails?.streaming == null ? '' : speechDetails.streaming ? 'true' : 'false'
                        }
                        className={inputClassName()}
                      >
                        <option value="">Unspecified</option>
                        <option value="true">True</option>
                        <option value="false">False</option>
                      </select>
                    </Field>
                    <Field label="Chunk Duration (ms)">
                      <input
                        name="speech_chunk_duration_ms"
                        inputMode="numeric"
                        defaultValue={speechDetails?.chunk_duration_ms == null ? '' : String(speechDetails.chunk_duration_ms)}
                        className={inputClassName()}
                      />
                    </Field>
                    <Field label="Language">
                      <input
                        name="speech_language"
                        defaultValue={typeof speechDetails?.language === 'string' ? speechDetails.language : ''}
                        className={inputClassName()}
                      />
                    </Field>
                    <Field label="Decoding Strategy">
                      <input
                        name="speech_decoding_strategy"
                        defaultValue={
                          typeof speechDetails?.decoding_strategy === 'string' ? speechDetails.decoding_strategy : ''
                        }
                        className={inputClassName()}
                      />
                    </Field>
                    <Field label="Speech Detail Notes" fullWidth>
                      <textarea
                        name="speech_notes"
                        rows={3}
                        defaultValue={typeof speechDetails?.notes === 'string' ? speechDetails.notes : ''}
                        className={inputClassName()}
                      />
                    </Field>
                  </ScenarioDetailsGrid>
                ) : null}

                {!selectedModelCategory ? (
                  <div className="rounded-xl border border-dashed border-slate-700 px-4 py-4 text-sm text-slate-400">
                    Select an `llm`, `vision`, or `speech` model to edit specialized scenario fields.
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
            <div className="text-lg font-semibold text-white">Result And Evidence</div>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <label className="block text-sm text-slate-300">
                Primary Value
                <input
                  name="primary_value"
                  inputMode="decimal"
                  defaultValue={benchmark?.primary_value == null ? '' : String(benchmark.primary_value)}
                  className={inputClassName()}
                />
              </label>
              <label className="block text-sm text-slate-300">
                Secondary Value
                <input
                  name="secondary_value"
                  inputMode="decimal"
                  defaultValue={benchmark?.secondary_value == null ? '' : String(benchmark.secondary_value)}
                  className={inputClassName()}
                />
              </label>
              <label className="block text-sm text-slate-300">
                Throughput
                <input
                  name="throughput"
                  inputMode="decimal"
                  defaultValue={benchmark?.throughput == null ? '' : String(benchmark.throughput)}
                  className={inputClassName()}
                />
              </label>
              <label className="block text-sm text-slate-300">
                Latency P50 (ms)
                <input
                  name="latency_ms_p50"
                  inputMode="decimal"
                  defaultValue={benchmark?.latency_ms_p50 == null ? '' : String(benchmark.latency_ms_p50)}
                  className={inputClassName()}
                />
              </label>
              <label className="block text-sm text-slate-300">
                Latency P99 (ms)
                <input
                  name="latency_ms_p99"
                  inputMode="decimal"
                  defaultValue={benchmark?.latency_ms_p99 == null ? '' : String(benchmark.latency_ms_p99)}
                  className={inputClassName()}
                />
              </label>
              <label className="block text-sm text-slate-300">
                Power (W)
                <input
                  name="power_watt"
                  inputMode="decimal"
                  defaultValue={benchmark?.power_watt == null ? '' : String(benchmark.power_watt)}
                  className={inputClassName()}
                />
              </label>
              <label className="block text-sm text-slate-300">
                Memory (GB)
                <input
                  name="memory_gb"
                  inputMode="decimal"
                  defaultValue={benchmark?.memory_gb == null ? '' : String(benchmark.memory_gb)}
                  className={inputClassName()}
                />
              </label>
              <label className="block text-sm text-slate-300">
                Evidence Kind
                <select
                  name="evidence_kind"
                  defaultValue={typeof evidence?.kind === 'string' ? evidence.kind : 'artifact'}
                  className={inputClassName()}
                >
                  <option value="artifact">Artifact</option>
                  <option value="log">Log</option>
                  <option value="report">Report</option>
                  <option value="screenshot">Screenshot</option>
                  <option value="command">Command</option>
                  <option value="repo">Repository</option>
                </select>
              </label>
              <label className="block text-sm text-slate-300 md:col-span-2">
                Evidence File Path Or URL
                <input
                  name="evidence_file_path"
                  defaultValue={typeof evidence?.file_path === 'string' ? evidence.file_path : ''}
                  className={inputClassName()}
                />
              </label>
              <label className="block text-sm text-slate-300">
                Evidence Title
                <input
                  name="evidence_title"
                  defaultValue={typeof evidence?.title === 'string' ? evidence.title : ''}
                  className={inputClassName()}
                />
              </label>
              <label className="block text-sm text-slate-300 md:col-span-2">
                Evidence Description
                <textarea
                  name="evidence_description"
                  rows={4}
                  defaultValue={typeof evidence?.description === 'string' ? evidence.description : ''}
                  className={inputClassName()}
                />
              </label>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400"
        >
          {isEditing ? 'Save Changes' : 'Create Draft'}
        </button>
      </form>

      {isEditing ? (
        <form action={deleteBenchmarkAction}>
          <input type="hidden" name="benchmark_result_id" value={benchmarkId} />
          <button
            type="submit"
            className="rounded-full border border-rose-500/40 bg-rose-500/10 px-5 py-3 text-sm font-medium text-rose-200 transition hover:border-rose-400"
          >
            Delete Benchmark Entry
          </button>
        </form>
      ) : null}
    </div>
  );
}

function ScenarioDetailsGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-5 md:grid-cols-2">{children}</div>;
}

function Field({
  label,
  fullWidth = false,
  children,
}: {
  label: string;
  fullWidth?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className={`block text-sm text-slate-300 ${fullWidth ? 'md:col-span-2' : ''}`}>
      {label}
      {children}
    </label>
  );
}
