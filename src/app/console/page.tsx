import Link from 'next/link';
import ConsoleShell from '@/components/ConsoleShell';
import { requireConsoleSession } from '@/lib/console-auth';
import { fetchManagedChipList } from '@/lib/chip-management';

export default async function ConsoleOverviewPage() {
  const session = await requireConsoleSession();
  const chips = await fetchManagedChipList(session);

  const counts = chips.reduce(
    (accumulator, chip) => {
      accumulator.total += 1;
      accumulator[chip.status] += 1;
      return accumulator;
    },
    {
      total: 0,
      draft: 0,
      pending_review: 0,
      published: 0,
      archived: 0,
    }
  );

  return (
    <ConsoleShell
      session={session}
      title="RealPerf Console"
      description="P0 establishes authenticated chip management, role-aware access control, and published-only reads on the public site."
    >
      <div className="space-y-6">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
            <div className="text-sm text-slate-500">Managed Chips</div>
            <div className="mt-2 text-4xl font-bold text-white">{counts.total}</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
            <div className="text-sm text-slate-500">Drafts</div>
            <div className="mt-2 text-4xl font-bold text-white">{counts.draft}</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
            <div className="text-sm text-slate-500">Pending Review</div>
            <div className="mt-2 text-4xl font-bold text-white">{counts.pending_review}</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
            <div className="text-sm text-slate-500">Published</div>
            <div className="mt-2 text-4xl font-bold text-white">{counts.published}</div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Next recommended work</h2>
              <p className="mt-2 text-sm text-slate-400">
                P0 now has an authenticated surface for chip records. The next layer is model, scenario, and benchmark
                ingestion using the schema in `docs/database-schema.md`.
              </p>
            </div>

            <Link
              href="/console/chips"
              className="rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400"
            >
              Open Chip Manager
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <div className="text-sm uppercase tracking-[0.24em] text-slate-500">Recent Catalog Entries</div>
          <div className="mt-5 divide-y divide-slate-800">
            {chips.slice(0, 8).map((chip) => (
              <div key={`${chip.source}:${chip.id}`} className="flex flex-wrap items-center justify-between gap-4 py-4">
                <div>
                  <div className="font-medium text-white">{chip.name}</div>
                  <div className="mt-1 text-sm text-slate-500">
                    {chip.source === 'cloud' ? 'Cloud' : 'Edge'} · {chip.manufacturer ?? 'Unknown manufacturer'}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="rounded-full border border-slate-800 bg-black/40 px-3 py-1 text-xs text-slate-400">
                    {chip.status}
                  </span>
                  <Link
                    href={chip.href}
                    className="text-sm font-medium text-emerald-400 transition hover:text-emerald-300"
                  >
                    Manage
                  </Link>
                </div>
              </div>
            ))}

            {chips.length === 0 ? (
              <div className="py-8 text-sm text-slate-500">No chip records are available for this account yet.</div>
            ) : null}
          </div>
        </div>
      </div>
    </ConsoleShell>
  );
}
