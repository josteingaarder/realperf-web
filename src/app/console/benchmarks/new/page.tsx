import ConsoleShell from '@/components/ConsoleShell';
import BenchmarkEditorForm from '@/components/BenchmarkEditorForm';
import { requireConsoleSession } from '@/lib/console-auth';
import { fetchBenchmarkChipOptions, fetchModelOptions } from '@/lib/benchmark-management';

function getMessage(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function NewBenchmarkPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireConsoleSession();
  const [chips, models, searchParams] = await Promise.all([
    fetchBenchmarkChipOptions(session),
    fetchModelOptions(),
    props.searchParams,
  ]);
  const error = getMessage(searchParams.error);
  const message = getMessage(searchParams.message);

  return (
    <ConsoleShell
      session={session}
      title="New Benchmark Entry"
      description="Create a benchmark result together with its model variant, test scenario, and evidence."
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

        <BenchmarkEditorForm chips={chips} models={models} actorRole={session.profile.role} />
      </div>
    </ConsoleShell>
  );
}
