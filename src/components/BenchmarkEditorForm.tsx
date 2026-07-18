import { changeBenchmarkStatusAction, deleteBenchmarkAction, saveBenchmarkAction } from '@/app/console/benchmarks/actions';
import type { BenchmarkChipOption, ManagedModelOption } from '@/lib/benchmark-management';
import type { AppRole } from '@/lib/console-auth';

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
  const evidence = Array.isArray(benchmark?.evidence) ? (benchmark?.evidence[0] as Record<string, unknown> | undefined) : undefined;
  const chipSource = typeof benchmark?.chip_source === 'string' ? benchmark.chip_source : 'cloud';

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
                <select name="chip_source" defaultValue={chipSource} className={inputClassName()}>
                  <option value="cloud">Cloud</option>
                  <option value="edge">Edge</option>
                </select>
              </label>
              <label className="block text-sm text-slate-300">
                Chip
                <select
                  name="chip_id"
                  defaultValue={typeof benchmark?.chip_id === 'string' ? benchmark.chip_id : ''}
                  className={inputClassName()}
                >
                  <option value="">Select a chip</option>
                  {chips.map((chip) => (
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
                  defaultValue={typeof model?.id === 'string' ? model.id : ''}
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
