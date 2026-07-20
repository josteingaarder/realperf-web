import Link from 'next/link';
import ConsolePasswordResetForm from '@/components/ConsolePasswordResetForm';

export default function ConsoleResetPasswordPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6 py-16">
        <div className="w-full rounded-[32px] border border-slate-800 bg-slate-950/90 p-8 shadow-2xl lg:p-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-800 bg-black/50 px-4 py-2 text-sm text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Password Recovery
          </div>

          <h1 className="mt-6 text-4xl font-bold tracking-tight">Set a new console password</h1>
          <p className="mt-4 text-base leading-7 text-slate-400">
            You reached this page from a recovery email. Save a new password, then return to the console login screen.
          </p>

          <ConsolePasswordResetForm />

          <Link href="/console/login" className="mt-8 inline-block text-sm font-medium text-emerald-400 transition hover:text-emerald-300">
            Back to console login
          </Link>
        </div>
      </div>
    </main>
  );
}
