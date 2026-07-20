import { redirect } from 'next/navigation';
import Link from 'next/link';
import {
  requestPasswordResetAction,
  resendVerificationEmailAction,
  signInAction,
  signOutAction,
  signUpAction,
} from '@/app/console/actions';
import { getConsoleSession, hasConsoleAccess } from '@/lib/console-auth';

function getMessage(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ConsoleLoginPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getConsoleSession();

  if (session && hasConsoleAccess(session)) {
    redirect('/console');
  }

  const searchParams = await props.searchParams;
  const error = getMessage(searchParams.error);
  const message = getMessage(searchParams.message);
  const inviteToken = getMessage(searchParams.invite);
  let invite:
    | {
        email: string;
        app_role: string;
        membership_role: string | null;
        manufacturer_name: string | null;
      }
    | null = null;

  if (inviteToken) {
    const { createServerSupabaseClient } = await import('@/lib/supabase-server');
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .from('console_access_invites')
      .select('email,app_role,membership_role,manufacturer_id')
      .eq('token', inviteToken)
      .maybeSingle();

    if (data) {
      let manufacturerName: string | null = null;

      if (data.manufacturer_id) {
        const { data: manufacturer } = await supabase
          .from('manufacturers')
          .select('name')
          .eq('id', data.manufacturer_id)
          .maybeSingle();

        manufacturerName = manufacturer?.name ?? null;
      }

      invite = {
        email: data.email,
        app_role: data.app_role,
        membership_role: data.membership_role,
        manufacturer_name: manufacturerName,
      };
    }
  }

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
                <div className="font-semibold text-white">Access workflow</div>
                <div className="mt-2 text-slate-400">
                  New accounts can register here, then a super admin grants `vendor_editor` and manufacturer access.
                </div>
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
            <h2 className="text-2xl font-semibold text-white">Console Access</h2>
            <p className="mt-2 text-sm text-slate-400">
              Sign in with an approved account, or register a new account and wait for a super admin to assign access.
            </p>

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

            {inviteToken ? (
              invite ? (
                <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-sm text-emerald-100">
                  <div className="font-semibold text-white">Invitation detected</div>
                  <div className="mt-2 text-emerald-100/80">
                    This invite is for {invite.email} and grants `{invite.app_role}`
                    {invite.manufacturer_name ? ` scoped to ${invite.manufacturer_name}` : ''}
                    {invite.membership_role ? ` as ${invite.membership_role}` : ''}.
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                  This invitation link is invalid or expired. You can still request access manually below.
                </div>
              )
            ) : null}

            {session && !hasConsoleAccess(session) ? (
              <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-100">
                <div className="font-semibold text-white">Account pending console access</div>
                <div className="mt-2 text-amber-100/80">
                  {session.user.email ?? 'This account'} is signed in, but a super admin still needs to assign a
                  console role and manufacturer membership.
                </div>
                <form action={signOutAction} className="mt-4">
                  <button
                    type="submit"
                    className="rounded-full border border-amber-400/40 px-4 py-2 text-sm font-medium text-amber-100 transition hover:border-amber-300 hover:text-white"
                  >
                    Sign Out
                  </button>
                </form>
              </div>
            ) : (
              <div className="mt-6 space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-white">Sign In</h3>
                  <p className="mt-1 text-sm text-slate-400">Use a Supabase Auth account that already has console access.</p>

                  <form action={signInAction} className="mt-5 space-y-5">
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

                  <div className="mt-4 text-center text-sm text-slate-400">
                    No account yet?{' '}
                    <Link href="#request-access" className="font-medium text-emerald-400 transition hover:text-emerald-300">
                      Create one below
                    </Link>
                  </div>

                  <div className="mt-5 grid gap-4 border-t border-slate-800 pt-5 md:grid-cols-2">
                    <form action={requestPasswordResetAction} className="space-y-3 rounded-2xl border border-slate-800 bg-black/30 p-4">
                      <div>
                        <div className="text-sm font-semibold text-white">Forgot password</div>
                        <p className="mt-1 text-sm text-slate-400">Send a recovery link that opens the password reset page.</p>
                      </div>
                      <input
                        name="email"
                        type="email"
                        required
                        placeholder="you@company.com"
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-500"
                      />
                      <button
                        type="submit"
                        className="w-full rounded-full border border-slate-700 px-4 py-3 text-sm font-medium text-white transition hover:border-emerald-500 hover:text-emerald-300"
                      >
                        Send Reset Link
                      </button>
                    </form>

                    <form action={resendVerificationEmailAction} className="space-y-3 rounded-2xl border border-slate-800 bg-black/30 p-4">
                      <div>
                        <div className="text-sm font-semibold text-white">Resend verification email</div>
                        <p className="mt-1 text-sm text-slate-400">Use this if registration succeeded but the inbox link expired.</p>
                      </div>
                      <input
                        name="email"
                        type="email"
                        required
                        placeholder="you@company.com"
                        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-emerald-500"
                      />
                      <button
                        type="submit"
                        className="w-full rounded-full border border-slate-700 px-4 py-3 text-sm font-medium text-white transition hover:border-emerald-500 hover:text-emerald-300"
                      >
                        Resend Verification
                      </button>
                    </form>
                  </div>
                </div>

                <div id="request-access" className="border-t border-slate-800 pt-6 scroll-mt-28">
                  <h3 className="text-lg font-semibold text-white">
                    {invite ? 'Accept Invitation' : 'Request Access'}
                  </h3>
                  <p className="mt-1 text-sm text-slate-400">
                    {invite
                      ? 'Create the invited account. The assigned role and manufacturer scope will activate automatically after signup.'
                      : 'Create an account first. A super admin can then assign role and manufacturer access in the console.'}
                  </p>

                  <form action={signUpAction} className="mt-5 space-y-5">
                    <input type="hidden" name="invite_token" value={inviteToken ?? ''} />
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
                        defaultValue={invite?.email ?? ''}
                        readOnly={Boolean(invite)}
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
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
