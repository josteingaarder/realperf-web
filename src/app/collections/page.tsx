'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { getFavorites, getSavedComparisons, deleteComparison, toggleFavorite } from '@/lib/storage';

interface Chip {
  id: string;
  name: string;
  manufacturer: string;
  category: string;
  fp16_tflops: number;
}

interface SavedComp {
  ids: string[];
  names: string[];
  createdAt: string;
}

export default function CollectionsPage() {
  const [favChips, setFavChips] = useState<Chip[]>([]);
  const [savedComps, setSavedComps] = useState<SavedComp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const favIds = getFavorites();
    if (favIds.length > 0) {
      supabase.from('chips').select('id,name,manufacturer,category,fp16_tflops').in('id', favIds).then(({ data }) => {
        setFavChips(data || []);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
    setSavedComps(getSavedComparisons());
  }, []);

  const handleRemoveFav = (id: string) => {
    toggleFavorite(id);
    setFavChips(prev => prev.filter(c => c.id !== id));
  };

  const handleDeleteComp = (index: number) => {
    deleteComparison(index);
    setSavedComps(getSavedComparisons());
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <nav className="sticky top-0 z-50 bg-black/50 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              RealPerf<span className="text-emerald-400">.ai</span>
            </span>
          </Link>
          <Link href="/chips" className="text-sm font-medium text-slate-400 hover:text-white transition">
            ← Back to Chips
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-8">My Collections</h1>

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
              <Link href="/chips" className="text-emerald-400 hover:underline text-sm">Go explore chips →</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {favChips.map((chip) => (
                <div key={chip.id} className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl hover:border-slate-600 transition">
                  <Link href={`/chips/${chip.id}`} className="flex-1">
                    <div className="text-sm text-emerald-400 font-semibold">{chip.manufacturer}</div>
                    <div className="text-white font-medium">{chip.name}</div>
                    <div className="text-xs text-slate-500">{chip.fp16_tflops} TFLOPS · {chip.category}</div>
                  </Link>
                  <button
                    onClick={() => handleRemoveFav(chip.id)}
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
                  <Link href={`/compare?ids=${comp.ids.join(',')}`} className="flex-1">
                    <div className="text-sm text-slate-500 mb-1">Saved {new Date(comp.createdAt).toLocaleDateString()}</div>
                    <div className="text-white font-medium">{comp.names.join(' vs ')}</div>
                  </Link>
                  <div className="flex items-center gap-2 ml-4">
                    <Link 
                      href={`/compare?ids=${comp.ids.join(',')}`}
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
