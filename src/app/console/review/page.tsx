import Link from 'next/link';
import { redirect } from 'next/navigation';
import ConsoleShell from '@/components/ConsoleShell';
import { changeBenchmarkStatusAction } from '@/app/console/benchmarks/actions';
import { changeChipStatusAction } from '@/app/console/chips/actions';
import { hasReviewAccess, requireConsoleSession } from '@/lib/console-auth';
import { fetchPendingReviewBenchmarkList } from '@/lib/benchmark-management';
import { fetchPendingReviewChipList } from '@/lib/chip-management';

function getMessage(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ConsoleReviewPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireConsoleSession();

  if (!hasReviewAccess(session)) {
    redirect('/console');
  }

  const [chips, benchmarks, searchParams] = await Promise.all([
    fetchPendingReviewChipList(session),
    fetchPendingReviewBenchmarkList(session),
    props.searchParams,
  ]);
  const message = getMessage(searchParams.message);
  const error = getMessage(searchParams.error);

  return (
    <ConsoleShell
      session={session}
      title="Review Queue"
      description="Approve or send back pending vendor submissions without hunting through the entire catalog."
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

        <div className="grid gap-5 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
            <div className="text-sm text-slate-500">Pending Chips</div>
            <div className="mt-2 text-4xl font-bold text-white">{chips.length}</div>
            <div className="mt-2 text-sm text-slate-400">Cloud and edge catalog records waiting for approval.</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
            <div className="text-sm text-slate-500">Pending Benchmarks</div>
            <div className="mt-2 text-4xl font-bold text-white">{benchmarks.length}</div>
            <div className="mt-2 text-sm text-slate-400">Benchmark results waiting for publish or return-to-draft review.</div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-sm uppercase tracking-[0.24em] text-slate-500">Chip Review</div>
              <h2 className="mt-2 text-2xl font-semibold text-white">Pending chip submissions</h2>
            </div>
            <Link
              href="/console/chips"
              className="rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-white transition hover:border-emerald-500"
            >
              Open Chip Manager
            </Link>
          </div>

          <div className="space-y-4">
            {chips.map((chip) => (
              <div
                key={`${chip.source}:${chip.id}`}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-black/30 p-4"
              >
                <div>
                  <div className="font-medium text-white">{chip.name}</div>
                  <div className="mt-1 text-sm text-slate-400">
                    {chip.source === 'cloud' ? 'Cloud' : 'Edge'} · {chip.manufacturer ?? 'Unknown manufacturer'} ·{' '}
                    {chip.category ?? 'Uncategorized'}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Updated {chip.updated_at ? new Date(chip.updated_at).toLocaleString() : '—'}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <form action={changeChipStatusAction}>
                    <input type="hidden" name="source" value={chip.source} />
                    <input type="hidden" name="chip_id" value={chip.id} />
                    <input type="hidden" name="next_status" value="draft" />
                    <input type="hidden" name="return_to" value="/console/review" />
                    <button
                      type="submit"
                      className="rounded-full border border-amber-500/40 px-4 py-2 text-sm font-medium text-amber-100 transition hover:border-amber-400 hover:text-white"
                    >
                      Send Back
                    </button>
                  </form>
                  <form action={changeChipStatusAction}>
                    <input type="hidden" name="source" value={chip.source} />
                    <input type="hidden" name="chip_id" value={chip.id} />
                    <input type="hidden" name="next_status" value="published" />
                    <input type="hidden" name="return_to" value="/console/review" />
                    <button
                      type="submit"
                      className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-emerald-400"
                    >
                      Publish
                    </button>
                  </form>
                  <Link href={chip.href} className="text-sm font-medium text-emerald-400 transition hover:text-emerald-300">
                    Open
                  </Link>
                </div>
              </div>
            ))}

            {chips.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-black/20 px-4 py-8 text-center text-sm text-slate-500">
                No chip submissions are waiting for review.
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-sm uppercase tracking-[0.24em] text-slate-500">Benchmark Review</div>
              <h2 className="mt-2 text-2xl font-semibold text-white">Pending benchmark submissions</h2>
            </div>
            <Link
              href="/console/benchmarks"
              className="rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-white transition hover:border-emerald-500"
            >
              Open Benchmark Manager
            </Link>
          </div>

          <div className="space-y-4">
            {benchmarks.map((benchmark) => (
              <div
                key={benchmark.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-black/30 p-4"
              >
                <div>
                  <div className="font-medium text-white">
                    {benchmark.chip_name} · {benchmark.model_name}
                  </div>
                  <div className="mt-1 text-sm text-slate-400">
                    {benchmark.variant_name} · {benchmark.task_type} · {benchmark.metric_name} ({benchmark.metric_unit})
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {benchmark.chip_source} · {benchmark.manufacturer_name ?? 'Unknown manufacturer'} · Updated{' '}
                    {benchmark.updated_at ? new Date(benchmark.updated_at).toLocaleString() : '—'}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <form action={changeBenchmarkStatusAction}>
                    <input type="hidden" name="benchmark_result_id" value={benchmark.id} />
                    <input type="hidden" name="next_status" value="draft" />
                    <input type="hidden" name="return_to" value="/console/review" />
                    <button
                      type="submit"
                      className="rounded-full border border-amber-500/40 px-4 py-2 text-sm font-medium text-amber-100 transition hover:border-amber-400 hover:text-white"
                    >
                      Send Back
                    </button>
                  </form>
                  <form action={changeBenchmarkStatusAction}>
                    <input type="hidden" name="benchmark_result_id" value={benchmark.id} />
                    <input type="hidden" name="next_status" value="published" />
                    <input type="hidden" name="return_to" value="/console/review" />
                    <button
                      type="submit"
                      className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-black transition hover:bg-emerald-400"
                    >
                      Publish
                    </button>
                  </form>
                  <Link
                    href={benchmark.href}
                    className="text-sm font-medium text-emerald-400 transition hover:text-emerald-300"
                  >
                    Open
                  </Link>
                </div>
              </div>
            ))}

            {benchmarks.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-black/20 px-4 py-8 text-center text-sm text-slate-500">
                No benchmark submissions are waiting for review.
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </ConsoleShell>
  );
}
