import Link from 'next/link';
import { notFound } from 'next/navigation';
import ConsoleShell from '@/components/ConsoleShell';
import BenchmarkEditorForm from '@/components/BenchmarkEditorForm';
import { requireConsoleSession } from '@/lib/console-auth';
import { fetchBenchmarkChipOptions, fetchBenchmarkForEdit, fetchModelOptions } from '@/lib/benchmark-management';

function getMessage(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function EditBenchmarkPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, searchParams] = await Promise.all([props.params, props.searchParams]);
  const session = await requireConsoleSession();
  const [chips, models, benchmark] = await Promise.all([
    fetchBenchmarkChipOptions(session),
    fetchModelOptions(),
    fetchBenchmarkForEdit(session, id),
  ]);

  if (!benchmark) {
    notFound();
  }

  const error = getMessage(searchParams.error);
  const message = getMessage(searchParams.message);
  const chipSource = typeof benchmark.chip_source === 'string' ? benchmark.chip_source : 'cloud';
  const chipId = typeof benchmark.chip_id === 'string' ? benchmark.chip_id : '';
  const publicHref = chipId ? (chipSource === 'cloud' ? `/chips/${chipId}` : `/edge/${chipId}`) : null;

  return (
    <ConsoleShell
      session={session}
      title="Benchmark Editor"
      description="Maintain the full benchmark chain, from variant metadata through scenario conditions and final numeric result."
    >
      <div className="space-y-6">
        {publicHref ? (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950 p-6">
            <div>
              <div className="text-sm text-slate-500">Related chip page</div>
              <div className="mt-2 text-lg font-semibold text-white">{publicHref}</div>
            </div>
            <Link
              href={publicHref}
              className="rounded-full border border-slate-700 px-5 py-3 text-sm font-medium text-white transition hover:border-emerald-500"
            >
              Open Chip Page
            </Link>
          </div>
        ) : null}

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

        <BenchmarkEditorForm benchmark={benchmark} chips={chips} models={models} actorRole={session.profile.role} />
      </div>
    </ConsoleShell>
  );
}
