import Link from 'next/link';
import type { PublicBenchmarkRow } from '@/lib/public-benchmarks';

interface ChipBenchmarkPanelProps {
  rows: PublicBenchmarkRow[];
  benchmarkCategoryHref?: string;
}

function formatValue(value: number | null, unit: string) {
  return value == null ? '—' : `${value.toLocaleString()} ${unit}`;
}

function formatScenarioSummary(row: PublicBenchmarkRow) {
  const parts = [
    row.taskType,
    row.framework,
    row.batchSize != null ? `Batch ${row.batchSize}` : null,
    row.sequenceLength != null ? `Seq ${row.sequenceLength}` : null,
    row.inputShape ?? row.inputResolution ?? null,
  ].filter(Boolean);

  return parts.join(' · ');
}

export default function ChipBenchmarkPanel({ rows, benchmarkCategoryHref }: ChipBenchmarkPanelProps) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden mb-12">
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Benchmark Results</h2>
          <div className="mt-1 text-xs text-slate-500">Published results grouped by model variant and scenario definition</div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800">
            {rows.length} results
          </span>
          {benchmarkCategoryHref ? (
            <Link href={benchmarkCategoryHref} className="text-xs font-medium text-emerald-400 hover:text-emerald-300">
              Open Category View
            </Link>
          ) : null}
        </div>
      </div>

      <div className="divide-y divide-slate-800">
        {rows.map((row) => (
          <div key={row.id} className="px-6 py-5 hover:bg-slate-900/30 transition">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="text-slate-200 font-medium text-sm">{row.modelName}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {row.variantName}
                  {row.precision ? ` · ${row.precision}` : ''}
                  {row.quantization ? ` · ${row.quantization}` : ''}
                </div>
                <div className="mt-2 text-sm text-slate-400">{formatScenarioSummary(row)}</div>
              </div>

              <div className="grid grid-cols-2 gap-4 lg:min-w-[320px]">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">{row.metricName}</div>
                  <div className="mt-1 text-lg font-bold text-emerald-400">
                    {formatValue(row.primaryValue, row.metricUnit)}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Latency P50</div>
                  <div className="mt-1 text-lg font-semibold text-white">{formatValue(row.latencyP50, 'ms')}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Throughput</div>
                  <div className="mt-1 text-sm text-slate-300">{formatValue(row.throughput, row.metricUnit)}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-500">Power</div>
                  <div className="mt-1 text-sm text-slate-300">{formatValue(row.powerWatt, 'W')}</div>
                </div>
              </div>
            </div>

            {row.notes ? <div className="mt-4 text-sm text-slate-500">{row.notes}</div> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
