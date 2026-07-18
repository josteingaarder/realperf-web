import type { ReactNode } from 'react';
import Link from 'next/link';
import { signOutAction } from '@/app/console/actions';
import type { ConsoleSession } from '@/lib/console-auth';

interface ConsoleShellProps {
  session: ConsoleSession;
  title: string;
  description?: string;
  children: ReactNode;
}

const navItems = [
  { href: '/console', label: 'Overview' },
  { href: '/console/chips', label: 'Chips' },
  { href: '/console/models', label: 'Models' },
  { href: '/console/benchmarks', label: 'Benchmarks' },
];

export default function ConsoleShell({
  session,
  title,
  description,
  children,
}: ConsoleShellProps) {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="border-b border-slate-800 bg-slate-950/90">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <Link href="/" className="text-sm font-medium text-emerald-400 transition hover:text-emerald-300">
              Back to Public Site
            </Link>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">{title}</h1>
            {description ? <p className="mt-2 max-w-3xl text-sm text-slate-400">{description}</p> : null}
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-full border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-300">
              {session.profile.display_name ?? session.user.email ?? 'Console User'}
            </div>
            <form action={signOutAction}>
              <button
                type="submit"
                className="rounded-full border border-slate-700 px-4 py-2 text-sm font-medium text-white transition hover:border-emerald-500"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 py-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
          <div className="mb-3 text-xs uppercase tracking-[0.24em] text-slate-500">Console</div>
          <nav className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-xl px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-slate-900 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <section>{children}</section>
      </div>
    </main>
  );
}
