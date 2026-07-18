import ConsoleShell from '@/components/ConsoleShell';
import ModelEditorForm from '@/components/ModelEditorForm';
import { requireConsoleSession } from '@/lib/console-auth';

function getMessage(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function NewModelPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireConsoleSession();
  const searchParams = await props.searchParams;
  const error = getMessage(searchParams.error);
  const message = getMessage(searchParams.message);

  return (
    <ConsoleShell
      session={session}
      title="New Model"
      description="Create a reusable model definition before attaching benchmark scenarios and results."
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

        <ModelEditorForm />
      </div>
    </ConsoleShell>
  );
}
