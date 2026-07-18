import Link from 'next/link';
import ConsoleShell from '@/components/ConsoleShell';
import { requireConsoleSession } from '@/lib/console-auth';
import { fetchBenchmarkList } from '@/lib/benchmark-management';

function getMessage(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ConsoleBenchmarksPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireConsoleSession();
  const benchmarks = await fetchBenchmarkList(session);
  const searchParams = await props.searchParams;
  const message = getMessage(searchParams.message);
  const error = getMessage(searchParams.error);

  return (
    <ConsoleShell
      session={session}
      title="Benchmark Entries"
      description="Capture result values together with the model variant, runtime scenario, and supporting evidence."
    >
      <div className="space-y-6">
        {message ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {message}
          </div>
        ) : null}
        {error ? (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <div>
            <div className="text-sm text-slate-500">Benchmark result pipeline</div>
            <h2 className="mt-2 text-2xl font-semibold text-white">Create model-linked performance records</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/console/models/new"
              className="rounded-full border border-slate-700 px-5 py-3 text-sm font-medium text-white transition hover:border-emerald-500"
            >
              New Model
            </Link>
            <Link
              href="/console/benchmarks/new"
              className="rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400"
            >
              New Benchmark Entry
            </Link>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-900/70">
                <th className="border-b border-slate-800 px-4 py-4 text-left text-sm font-medium text-slate-500">Chip</th>
                <th className="border-b border-slate-800 px-4 py-4 text-left text-sm font-medium text-slate-500">Model</th>
                <th className="border-b border-slate-800 px-4 py-4 text-left text-sm font-medium text-slate-500">Scenario</th>
                <th className="border-b border-slate-800 px-4 py-4 text-left text-sm font-medium text-slate-500">Primary Value</th>
                <th className="border-b border-slate-800 px-4 py-4 text-left text-sm font-medium text-slate-500">Status</th>
                <th className="border-b border-slate-800 px-4 py-4 text-left text-sm font-medium text-slate-500">Updated</th>
                <th className="border-b border-slate-800 px-4 py-4 text-left text-sm font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {benchmarks.map((benchmark) => (
                <tr key={benchmark.id} className="border-b border-slate-800/70">
                  <td className="px-4 py-4">
                    <div className="font-medium text-white">{benchmark.chip_name}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {benchmark.chip_source} · {benchmark.manufacturer_name ?? 'Unknown manufacturer'}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-slate-300">{benchmark.model_name}</div>
                    <div className="mt-1 text-xs text-slate-500">{benchmark.variant_name}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-slate-300">{benchmark.task_type}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {benchmark.metric_name} ({benchmark.metric_unit})
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-300">{benchmark.primary_value.toLocaleString()}</td>
                  <td className="px-4 py-4">
                    <span className="rounded-full border border-slate-800 bg-black/40 px-3 py-1 text-xs text-slate-400">
                      {benchmark.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-500">
                    {benchmark.updated_at ? new Date(benchmark.updated_at).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-4">
                    <Link
                      href={benchmark.href}
                      className="text-sm font-medium text-emerald-400 transition hover:text-emerald-300"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}

              {benchmarks.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                    No benchmark entries exist yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </ConsoleShell>
  );
}
