import Link from 'next/link';
import { notFound } from 'next/navigation';
import ChipEditorForm from '@/components/ChipEditorForm';
import ConsoleShell from '@/components/ConsoleShell';
import { requireConsoleSession } from '@/lib/console-auth';
import { fetchChipForEdit, fetchManufacturerOptions, isChipSource } from '@/lib/chip-management';

function getMessage(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function EditChipPage(props: {
  params: Promise<{ source: string; id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ source, id }, searchParams] = await Promise.all([props.params, props.searchParams]);

  if (!isChipSource(source)) {
    notFound();
  }

  const session = await requireConsoleSession();
  const [manufacturers, chip] = await Promise.all([
    fetchManufacturerOptions(session),
    fetchChipForEdit(session, source, id),
  ]);

  if (!chip) {
    notFound();
  }

  const error = getMessage(searchParams.error);
  const message = getMessage(searchParams.message);
  const publicHref = source === 'cloud' ? `/chips/${id}` : `/edge/${id}`;

  return (
    <ConsoleShell
      session={session}
      title={typeof chip.name === 'string' ? chip.name : 'Chip Editor'}
      description="Review lifecycle status, update chip attributes, and control when the public site can see this entry."
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950 p-6">
          <div>
            <div className="text-sm text-slate-500">Public route</div>
            <div className="mt-2 text-lg font-semibold text-white">{publicHref}</div>
          </div>

          <Link
            href={publicHref}
            className="rounded-full border border-slate-700 px-5 py-3 text-sm font-medium text-white transition hover:border-emerald-500"
          >
            Open Public Page
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

        <ChipEditorForm source={source} chip={chip} manufacturers={manufacturers} actorRole={session.profile.role} />
      </div>
    </ConsoleShell>
  );
}
