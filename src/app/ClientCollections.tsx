'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchFavoriteChipCards, getSourceLabel, type FavoriteChipCard } from '@/lib/catalog';
import { buildCompareHref, getFavorites, getSavedComparisons, type SavedComparison } from '@/lib/storage';

export default function ClientCollections() {
  const [favChips, setFavChips] = useState<FavoriteChipCard[]>([]);
  const [savedComps, setSavedComps] = useState<SavedComparison[]>(getSavedComparisons());

  useEffect(() => {
    fetchFavoriteChipCards(getFavorites()).then((cards) => {
      setFavChips(cards);
    });

    Promise.resolve().then(() => {
      setSavedComps(getSavedComparisons());
    });
  }, []);

  if (favChips.length === 0 && savedComps.length === 0) return null;

  return (
    <section className="px-6 pb-12">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">My Collections</h2>
          <Link href="/collections" className="text-sm text-emerald-400 hover:underline">View All</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {favChips.slice(0, 3).map((chip) => (
            <Link key={`${chip.source}:${chip.id}`} href={chip.href} className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl hover:border-emerald-500/50 transition">
              <div>
                <div className="text-xs text-cyan-400 font-semibold uppercase">{getSourceLabel(chip.source)}</div>
                <div className="text-sm text-emerald-400 font-semibold">{chip.manufacturer}</div>
                <div className="text-white font-medium">{chip.name}</div>
              </div>
              <div className="text-sm text-slate-500">{chip.primaryMetricValue}</div>
            </Link>
          ))}
          {savedComps.slice(0, 2).map((comp, i) => (
            <Link key={i} href={buildCompareHref(comp.items)} className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl hover:border-emerald-500/50 transition">
              <div>
                <div className="text-sm text-slate-500">Saved Comparison</div>
                <div className="text-white font-medium text-sm truncate max-w-[200px]">{comp.names.join(' vs ')}</div>
              </div>
              <div className="text-xs text-emerald-400">Compare →</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
