import Link from 'next/link';
import ConsoleShell from '@/components/ConsoleShell';
import { requireConsoleSession } from '@/lib/console-auth';
import { fetchManagedChipList } from '@/lib/chip-management';

function getMessage(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ConsoleChipsPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireConsoleSession();
  const chips = await fetchManagedChipList(session);
  const searchParams = await props.searchParams;
  const message = getMessage(searchParams.message);
  const error = getMessage(searchParams.error);

  return (
    <ConsoleShell
      session={session}
      title="Chip Manager"
      description="Create drafts, submit updates for review, and publish catalog records with role-aware controls."
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
            <div className="text-sm text-slate-500">Available actions</div>
            <h2 className="mt-2 text-2xl font-semibold text-white">Manage cloud and edge chip catalog entries</h2>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/console/chips/cloud/new"
              className="rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400"
            >
              New Cloud Chip
            </Link>
            <Link
              href="/console/chips/edge/new"
              className="rounded-full border border-slate-700 px-5 py-3 text-sm font-medium text-white transition hover:border-emerald-500"
            >
              New Edge Chip
            </Link>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-900/70">
                <th className="border-b border-slate-800 px-4 py-4 text-left text-sm font-medium text-slate-500">Chip</th>
                <th className="border-b border-slate-800 px-4 py-4 text-left text-sm font-medium text-slate-500">Type</th>
                <th className="border-b border-slate-800 px-4 py-4 text-left text-sm font-medium text-slate-500">Manufacturer</th>
                <th className="border-b border-slate-800 px-4 py-4 text-left text-sm font-medium text-slate-500">Status</th>
                <th className="border-b border-slate-800 px-4 py-4 text-left text-sm font-medium text-slate-500">Updated</th>
                <th className="border-b border-slate-800 px-4 py-4 text-left text-sm font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {chips.map((chip) => (
                <tr key={`${chip.source}:${chip.id}`} className="border-b border-slate-800/70">
                  <td className="px-4 py-4">
                    <div className="font-medium text-white">{chip.name}</div>
                    <div className="mt-1 text-xs text-slate-500">{chip.category ?? 'Uncategorized'}</div>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-300">{chip.source === 'cloud' ? 'Cloud' : 'Edge'}</td>
                  <td className="px-4 py-4 text-sm text-slate-300">{chip.manufacturer ?? 'Unknown manufacturer'}</td>
                  <td className="px-4 py-4">
                    <span className="rounded-full border border-slate-800 bg-black/40 px-3 py-1 text-xs text-slate-400">
                      {chip.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-500">
                    {chip.updated_at ? new Date(chip.updated_at).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-4">
                    <Link href={chip.href} className="text-sm font-medium text-emerald-400 transition hover:text-emerald-300">
                      Open
                    </Link>
                  </td>
                </tr>
              ))}

              {chips.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                    No chip records are available for this account yet.
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
