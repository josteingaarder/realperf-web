import { Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import ChipFilter from './ChipFilter';
import SiteHeader from '@/components/SiteHeader';

export default async function ChipsPage() {
  const { data: chips, error } = await supabase
    .from('cloud_chips')
    .select('*')
    .order('fp16_tflops', { ascending: false });

  if (error || !chips) {
    return (
      <main className="min-h-screen bg-black text-white p-8">
        <h1 className="text-3xl font-bold">Error loading chips</h1>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <SiteHeader activeSection="cloud" />

      <div className="p-8 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">AI Chip Database</h1>
          <p className="text-sm text-slate-500 mt-1">Search, filter, and compare AI accelerators</p>
        </div>
        
        <Suspense fallback={<div className="text-slate-500">Loading chip filters...</div>}>
          <ChipFilter chips={chips} />
        </Suspense>
      </div>
    </main>
  );
}
