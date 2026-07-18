import Link from 'next/link';
import { notFound } from 'next/navigation';
import ConsoleShell from '@/components/ConsoleShell';
import ModelEditorForm from '@/components/ModelEditorForm';
import { requireConsoleSession } from '@/lib/console-auth';
import { fetchModelForEdit } from '@/lib/benchmark-management';

function getMessage(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function EditModelPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, searchParams] = await Promise.all([props.params, props.searchParams]);
  const session = await requireConsoleSession();
  const model = await fetchModelForEdit(id);

  if (!model) {
    notFound();
  }

  const error = getMessage(searchParams.error);
  const message = getMessage(searchParams.message);

  return (
    <ConsoleShell
      session={session}
      title={typeof model.name === 'string' ? model.name : 'Model Editor'}
      description="Update the canonical model definition used by benchmark variants and scenarios."
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <div>
            <div className="text-sm text-slate-500">Next step</div>
            <div className="mt-2 text-lg font-semibold text-white">Use this model in benchmark result entries</div>
          </div>
          <Link
            href="/console/benchmarks/new"
            className="rounded-full border border-slate-700 px-5 py-3 text-sm font-medium text-white transition hover:border-emerald-500"
          >
            New Benchmark Entry
          </Link>
        </div>

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

        <ModelEditorForm model={model} />
      </div>
    </ConsoleShell>
  );
}
