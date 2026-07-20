'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { deleteSavedComparisonAction, toggleFavoriteAction } from '@/app/collections/actions';
import SiteHeader from '@/components/SiteHeader';
import { fetchFavoriteChipCards, getSourceLabel, type FavoriteChipCard } from '@/lib/catalog';
import { buildCompareHref, type StoredChipRef } from '@/lib/storage';
import type { SavedComparisonRecord } from '@/lib/account-collections';

export default function CollectionsClientPage({
  initialFavorites,
  initialComparisons,
}: {
  initialFavorites: StoredChipRef[];
  initialComparisons: SavedComparisonRecord[];
}) {
  const [favoriteRefs, setFavoriteRefs] = useState<StoredChipRef[]>(initialFavorites);
  const [favoriteCards, setFavoriteCards] = useState<FavoriteChipCard[]>([]);
  const [savedComparisons, setSavedComparisons] = useState<SavedComparisonRecord[]>(initialComparisons);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (favoriteRefs.length === 0) {
      setFavoriteCards([]);
      return;
    }

    fetchFavoriteChipCards(favoriteRefs).then((cards) => {
      setFavoriteCards(cards);
    });
  }, [favoriteRefs]);

  const handleRemoveFavorite = (item: StoredChipRef) => {
    const previousFavorites = favoriteRefs;
    setFavoriteRefs((current) =>
      current.filter((favorite) => !(favorite.id === item.id && favorite.source === item.source))
    );

    startTransition(() => {
      toggleFavoriteAction(item).then((result) => {
        if (!result.ok) {
          setFavoriteRefs(previousFavorites);
          window.alert(result.message);
        }
      });
    });
  };

  const handleDeleteComparison = (id: string) => {
    const previousComparisons = savedComparisons;
    setSavedComparisons((current) => current.filter((comparison) => comparison.id !== id));

    startTransition(() => {
      deleteSavedComparisonAction(id).then((result) => {
        if (!result.ok) {
          setSavedComparisons(previousComparisons);
          window.alert(result.message);
        }
      });
    });
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <SiteHeader activeSection="collections" />

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">My Collections</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your favorite Cloud and Edge chips, as well as your saved comparisons.
          </p>
        </div>

        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            Favorite Chips
          </h2>

          {favoriteCards.length === 0 ? (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-8 text-center">
              <p className="text-slate-500 mb-2">No favorite chips yet</p>
              <div className="flex items-center justify-center gap-4 text-sm">
                <Link href="/chips" className="text-emerald-400 hover:underline">
                  Browse Cloud Chips
                </Link>
                <Link href="/edge" className="text-emerald-400 hover:underline">
                  Browse Edge Chips
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {favoriteCards.map((chip) => (
                <div
                  key={`${chip.source}:${chip.id}`}
                  className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl hover:border-slate-600 transition"
                >
                  <Link href={chip.href} className="flex-1">
                    <div className="text-xs text-cyan-400 font-semibold uppercase">{getSourceLabel(chip.source)}</div>
                    <div className="text-sm text-emerald-400 font-semibold">{chip.manufacturer}</div>
                    <div className="text-white font-medium">{chip.name}</div>
                    <div className="text-xs text-slate-500">
                      {chip.primaryMetricValue} · {chip.category}
                    </div>
                  </Link>
                  <button
                    onClick={() => handleRemoveFavorite({ id: chip.id, source: chip.source })}
                    className="ml-4 p-2 text-red-500 hover:bg-red-500/10 rounded-full transition"
                    title="Remove from favorites"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            Saved Comparisons
          </h2>

          {savedComparisons.length === 0 ? (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-8 text-center">
              <p className="text-slate-500 mb-2">No saved comparisons yet</p>
              <Link href="/chips" className="text-emerald-400 hover:underline text-sm">
                Go compare chips →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {savedComparisons.map((comparison) => (
                <div
                  key={comparison.id}
                  className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl hover:border-slate-600 transition"
                >
                  <Link href={buildCompareHref(comparison.items)} className="flex-1">
                    <div className="text-sm text-slate-500 mb-1">
                      Saved {new Date(comparison.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-white font-medium">{comparison.names.join(' vs ')}</div>
                  </Link>
                  <div className="flex items-center gap-2 ml-4">
                    <Link
                      href={buildCompareHref(comparison.items)}
                      className="px-3 py-1.5 text-sm bg-emerald-500/10 text-emerald-400 rounded-full hover:bg-emerald-500/20 transition"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => handleDeleteComparison(comparison.id)}
                      className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-full transition"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
