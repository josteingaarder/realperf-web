'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { fetchFavoriteChipCards, getSourceLabel, type FavoriteChipCard } from '@/lib/catalog';
import {
  buildCompareHref,
  deleteComparison,
  getFavorites,
  getSavedComparisons,
  toggleFavorite,
  type SavedComparison,
} from '@/lib/storage';

export default function CollectionsPage() {
  const [favChips, setFavChips] = useState<FavoriteChipCard[]>([]);
  const [savedComps, setSavedComps] = useState<SavedComparison[]>(getSavedComparisons());

  useEffect(() => {
    const favorites = getFavorites();
    fetchFavoriteChipCards(favorites).then((cards) => {
      setFavChips(cards);
    });

    Promise.resolve().then(() => {
      setSavedComps(getSavedComparisons());
    });
  }, []);

  const handleRemoveFav = (id: string, source: 'cloud' | 'edge') => {
    toggleFavorite({ id, source });
    setFavChips((prev) => prev.filter((chip) => !(chip.id === id && chip.source === source)));
  };

  const handleDeleteComp = (index: number) => {
    deleteComparison(index);
    setSavedComps(getSavedComparisons());
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

        {/* 收藏的芯片 */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            Favorite Chips
          </h2>
          
          {favChips.length === 0 ? (
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
              {favChips.map((chip) => (
                <div key={`${chip.source}:${chip.id}`} className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl hover:border-slate-600 transition">
                  <Link href={chip.href} className="flex-1">
                    <div className="text-xs text-cyan-400 font-semibold uppercase">{getSourceLabel(chip.source)}</div>
                    <div className="text-sm text-emerald-400 font-semibold">{chip.manufacturer}</div>
                    <div className="text-white font-medium">{chip.name}</div>
                    <div className="text-xs text-slate-500">
                      {chip.primaryMetricValue} · {chip.category}
                    </div>
                  </Link>
                  <button
                    onClick={() => handleRemoveFav(chip.id, chip.source)}
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

        {/* 保存的对比 */}
        <section>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            Saved Comparisons
          </h2>

          {savedComps.length === 0 ? (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-8 text-center">
              <p className="text-slate-500 mb-2">No saved comparisons yet</p>
              <Link href="/chips" className="text-emerald-400 hover:underline text-sm">Go compare chips →</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {savedComps.map((comp, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl hover:border-slate-600 transition">
                  <Link href={buildCompareHref(comp.items)} className="flex-1">
                    <div className="text-sm text-slate-500 mb-1">Saved {new Date(comp.createdAt).toLocaleDateString()}</div>
                    <div className="text-white font-medium">{comp.names.join(' vs ')}</div>
                  </Link>
                  <div className="flex items-center gap-2 ml-4">
                    <Link 
                      href={buildCompareHref(comp.items)}
                      className="px-3 py-1.5 text-sm bg-emerald-500/10 text-emerald-400 rounded-full hover:bg-emerald-500/20 transition"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => handleDeleteComp(i)}
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
