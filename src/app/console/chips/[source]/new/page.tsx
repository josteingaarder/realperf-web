import { notFound } from 'next/navigation';
import ChipEditorForm from '@/components/ChipEditorForm';
import ConsoleShell from '@/components/ConsoleShell';
import { requireConsoleSession } from '@/lib/console-auth';
import { fetchManufacturerOptions, isChipSource } from '@/lib/chip-management';

function getMessage(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function NewChipPage(props: {
  params: Promise<{ source: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ source }, searchParams] = await Promise.all([props.params, props.searchParams]);

  if (!isChipSource(source)) {
    notFound();
  }

  const session = await requireConsoleSession();
  const manufacturers = await fetchManufacturerOptions(session);
  const error = getMessage(searchParams.error);
  const message = getMessage(searchParams.message);

  return (
    <ConsoleShell
      session={session}
      title={`New ${source === 'cloud' ? 'Cloud' : 'Edge'} Chip`}
      description="Create a draft chip profile. Public pages remain unchanged until the record is published."
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

        <ChipEditorForm source={source} manufacturers={manufacturers} actorRole={session.profile.role} />
      </div>
    </ConsoleShell>
  );
}
