import { redirect } from 'next/navigation';
import Link from 'next/link';
import { signInAction } from '@/app/console/actions';
import { getConsoleSession } from '@/lib/console-auth';

function getMessage(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ConsoleLoginPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getConsoleSession();

  if (session) {
    redirect('/console');
  }

  const searchParams = await props.searchParams;
  const error = getMessage(searchParams.error);
  const message = getMessage(searchParams.message);

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-16">
        <div className="grid w-full max-w-5xl gap-10 rounded-[32px] border border-slate-800 bg-slate-950/90 p-8 shadow-2xl lg:grid-cols-[1.1fr_0.9fr] lg:p-12">
          <section>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-black/50 px-4 py-2 text-sm text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Admin Console
            </div>
            <h1 className="mt-6 text-4xl font-bold tracking-tight">Manage RealPerf data with controlled access</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
              Sign in with an authorized account to manage chip records, review lifecycle state, and prepare the
              ingestion foundation for benchmark data.
            </p>

            <div className="mt-8 space-y-4 text-sm text-slate-300">
              <div className="rounded-2xl border border-slate-800 bg-black/40 p-5">
                <div className="font-semibold text-white">Role model</div>
                <div className="mt-2 text-slate-400">Supports `super_admin`, `vendor_editor`, and `user` roles.</div>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-black/40 p-5">
                <div className="font-semibold text-white">Publishing rule</div>
                <div className="mt-2 text-slate-400">The public site reads `published` rows only.</div>
              </div>
            </div>

            <Link href="/" className="mt-8 inline-block text-sm font-medium text-emerald-400 transition hover:text-emerald-300">
              Back to homepage
            </Link>
          </section>

          <section className="rounded-3xl border border-slate-800 bg-black/60 p-6">
            <h2 className="text-2xl font-semibold text-white">Sign In</h2>
            <p className="mt-2 text-sm text-slate-400">Use a Supabase Auth account that already has console access.</p>

            {error ? (
              <div className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </div>
            ) : null}

            {message ? (
              <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                {message}
              </div>
            ) : null}

            <form action={signInAction} className="mt-6 space-y-5">
              <label className="block text-sm text-slate-300">
                Email
                <input
                  name="email"
                  type="email"
                  required
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-500"
                />
              </label>

              <label className="block text-sm text-slate-300">
                Password
                <input
                  name="password"
                  type="password"
                  required
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-500"
                />
              </label>

              <button
                type="submit"
                className="w-full rounded-full bg-emerald-500 px-5 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400"
              >
                Enter Console
              </button>
            </form>
          </section>
        </div>
      </div>
    </main>
  );
}
