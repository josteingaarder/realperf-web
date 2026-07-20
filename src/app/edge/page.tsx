import { Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import EdgeChipFilter from './EdgeChipFilter';
import SiteHeaderWithAuth from '@/components/SiteHeaderWithAuth';
import { fetchFavoriteRefsForCurrentUser, getCollectionViewer } from '@/lib/account-collections';

export default async function EdgePage() {
  const [{ data: chips, error }, favorites, viewer] = await Promise.all([
    supabase.from('edge_chips').select('*').eq('status', 'published').order('ai_tops', { ascending: false }),
    fetchFavoriteRefsForCurrentUser(),
    getCollectionViewer(),
  ]);

  if (error || !chips) {
    return (
      <main className="min-h-screen bg-black text-white p-8">
        <h1 className="text-3xl font-bold">Error loading edge chips</h1>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <SiteHeaderWithAuth
        activeSection="edge"
        cta={{ href: '/collections', label: 'My Collections' }}
      />

      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Edge AI Chip Database</h1>
          <p className="text-sm text-slate-500 mt-1">Low-power accelerators for edge inference and embedded AI</p>
        </div>

        <Suspense fallback={<div className="text-slate-500">Loading edge chips...</div>}>
          <EdgeChipFilter chips={chips} initialFavorites={favorites} canSaveCollections={Boolean(viewer)} />
        </Suspense>
      </div>
    </main>
  );
}
