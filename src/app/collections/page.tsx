import Link from 'next/link';
import SiteHeaderWithAuth from '@/components/SiteHeaderWithAuth';
import CollectionsClientPage from '@/app/collections/CollectionsClientPage';
import { fetchCollectionsState } from '@/lib/account-collections';

export default async function CollectionsPage() {
  const state = await fetchCollectionsState();

  return (
    state.user ? (
      <CollectionsClientPage initialFavorites={state.favorites} initialComparisons={state.comparisons} />
    ) : (
      <main className="min-h-screen bg-black text-white">
        <SiteHeaderWithAuth activeSection="collections" />

        <div className="mx-auto flex max-w-3xl items-center justify-center px-6 py-24">
          <div className="w-full rounded-[32px] border border-slate-800 bg-slate-950/90 p-10 text-center shadow-2xl">
            <h1 className="text-3xl font-bold tracking-tight text-white">Sign in to use My Collections</h1>
            <p className="mt-4 text-base leading-7 text-slate-400">
              Favorites and saved comparisons are now tied to your account. Guests can browse the database, but only
              signed-in users can save chips and comparison views.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/sign-in"
                className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400"
              >
                Sign In
              </Link>
              <Link
                href="/create-account"
                className="rounded-full border border-slate-700 px-6 py-3 text-sm font-semibold text-white transition hover:border-emerald-500 hover:text-emerald-300"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </main>
    )
  );
}
