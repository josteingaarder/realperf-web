import Link from 'next/link';
import ConsoleShell from '@/components/ConsoleShell';
import { requireConsoleSession } from '@/lib/console-auth';
import { fetchModelList } from '@/lib/benchmark-management';

function getMessage(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ConsoleModelsPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireConsoleSession();
  const models = await fetchModelList();
  const searchParams = await props.searchParams;
  const message = getMessage(searchParams.message);
  const error = getMessage(searchParams.error);

  return (
    <ConsoleShell
      session={session}
      title="Model Registry"
      description="Manage benchmark-ready model definitions that can be reused across multiple chip result entries."
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
            <div className="text-sm text-slate-500">Reusable benchmark catalog</div>
            <h2 className="mt-2 text-2xl font-semibold text-white">Create and publish model definitions</h2>
          </div>
          <Link
            href="/console/models/new"
            className="rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400"
          >
            New Model
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-900/70">
                <th className="border-b border-slate-800 px-4 py-4 text-left text-sm font-medium text-slate-500">Model</th>
                <th className="border-b border-slate-800 px-4 py-4 text-left text-sm font-medium text-slate-500">Category</th>
                <th className="border-b border-slate-800 px-4 py-4 text-left text-sm font-medium text-slate-500">Vendor</th>
                <th className="border-b border-slate-800 px-4 py-4 text-left text-sm font-medium text-slate-500">Status</th>
                <th className="border-b border-slate-800 px-4 py-4 text-left text-sm font-medium text-slate-500">Updated</th>
                <th className="border-b border-slate-800 px-4 py-4 text-left text-sm font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {models.map((model) => (
                <tr key={model.id} className="border-b border-slate-800/70">
                  <td className="px-4 py-4">
                    <div className="font-medium text-white">{model.name}</div>
                    <div className="mt-1 text-xs text-slate-500">{model.family ?? 'No family assigned'}</div>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-300">{model.category}</td>
                  <td className="px-4 py-4 text-sm text-slate-300">{model.vendor ?? 'Unknown vendor'}</td>
                  <td className="px-4 py-4">
                    <span className="rounded-full border border-slate-800 bg-black/40 px-3 py-1 text-xs text-slate-400">
                      {model.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-500">
                    {model.updated_at ? new Date(model.updated_at).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-4">
                    <Link
                      href={`/console/models/${model.id}`}
                      className="text-sm font-medium text-emerald-400 transition hover:text-emerald-300"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))}

              {models.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                    No models have been created yet.
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
