import Link from 'next/link';
import { redirect } from 'next/navigation';
import { publicSignUpAction } from '@/app/auth/actions';
import { getConsoleSession } from '@/lib/console-auth';

function getMessage(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CreateAccountPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getConsoleSession();

  if (session) {
    if (session.profile.role === 'super_admin' || session.profile.role === 'vendor_editor') {
      redirect('/console');
    }

    redirect('/collections');
  }

  const searchParams = await props.searchParams;
  const error = getMessage(searchParams.error);

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen max-w-2xl items-center justify-center px-6 py-16">
        <section className="w-full rounded-[32px] border border-slate-800 bg-slate-950/90 p-8 shadow-2xl sm:p-10">
          <Link href="/" className="inline-block text-sm font-medium text-emerald-400 transition hover:text-emerald-300">
            Back to homepage
          </Link>

          {error ? (
            <div className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {error}
            </div>
          ) : null}

          <div className="mt-6">
            <h1 className="text-4xl font-bold tracking-tight text-white">Create Account</h1>
            <p className="mt-4 text-base leading-7 text-slate-400">
              Create a public account to save favorite chips and keep benchmark comparisons tied to your profile.
            </p>

            <form action={publicSignUpAction} className="mt-8 space-y-5">
              <label className="block text-sm text-slate-300">
                Display Name
                <input
                  name="display_name"
                  type="text"
                  required
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-500"
                />
              </label>

              <label className="block text-sm text-slate-300">
                Email
                <input
                  name="email"
                  type="email"
                  required
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-500"
                />
              </label>

              <div className="grid gap-5 md:grid-cols-2">
                <label className="block text-sm text-slate-300">
                  Password
                  <input
                    name="password"
                    type="password"
                    minLength={8}
                    required
                    className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-500"
                  />
                </label>

                <label className="block text-sm text-slate-300">
                  Confirm Password
                  <input
                    name="confirm_password"
                    type="password"
                    minLength={8}
                    required
                    className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-500"
                  />
                </label>
              </div>

              <button
                type="submit"
                className="w-full rounded-full border border-slate-700 px-5 py-3 text-sm font-semibold text-white transition hover:border-emerald-500 hover:text-emerald-300"
              >
                Create Account
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-400">
              Already have an account?{' '}
              <Link href="/sign-in" className="font-medium text-emerald-400 transition hover:text-emerald-300">
                Sign in
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
