import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { supabase } from '@/lib/supabase';
import { serializeCompareItems } from '@/lib/storage';
import ChipBenchmarkPanel from '@/components/ChipBenchmarkPanel';
import { fetchPublicBenchmarkRowsForChip } from '@/lib/public-benchmarks';

function getBenchmarkCategoryHref(category: string | null | undefined) {
  if (category === 'vision' || category === 'speech' || category === 'llm') {
    return `/benchmark/${category}`;
  }

  return undefined;
}

export default async function EdgeChipDetailPage(
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const id = params?.id;

  if (!id) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Missing chip ID</h1>
          <Link href="/edge" className="text-emerald-400 hover:underline">
            Back to Edge database
          </Link>
        </div>
      </main>
    );
  }

  const { data: chip, error } = await supabase
    .from('edge_chips')
    .select('*')
    .eq('id', id)
    .eq('status', 'published')
    .single();

  if (error || !chip) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Edge chip not found</h1>
          <Link href="/edge" className="text-emerald-400 hover:underline">
            Back to Edge database
          </Link>
        </div>
      </main>
    );
  }

  const perfPerDollar =
    chip.ai_tops && chip.price_usd ? (chip.ai_tops / chip.price_usd).toFixed(2) : null;
  const benchmarks = await fetchPublicBenchmarkRowsForChip('edge', id);

  const specs = [
    { label: 'Manufacturer', value: chip.manufacturer || '—' },
    { label: 'Category', value: chip.category || '—' },
    { label: 'Process Node', value: chip.process_node || '—' },
    { label: 'Release Date', value: chip.release_date || '—' },
    { label: 'VRAM', value: chip.vram_gb ? `${chip.vram_gb} GB` : '—' },
    { label: 'TDP', value: chip.tdp_watt ? `${chip.tdp_watt} W` : '—' },
    { label: 'AI TOPS', value: chip.ai_tops ? `${chip.ai_tops} TOPS` : '—' },
    { label: 'Price (USD)', value: chip.price_usd ? `$${chip.price_usd.toLocaleString()}` : '—' },
  ];

  return (
    <main className="min-h-screen bg-black text-white">
      <SiteHeader activeSection="edge" secondaryLink={{ href: '/edge', label: 'Back to List' }} />

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm font-bold text-emerald-400 tracking-wide uppercase">
              {chip.manufacturer}
            </span>
            <span className="text-xs text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800">
              {chip.category}
            </span>
          </div>
          <h1 className="text-5xl font-bold mb-4">{chip.name}</h1>
          <p className="text-slate-400 text-lg max-w-2xl">
            {chip.process_node
              ? `Built for edge inference workloads on ${chip.process_node}. Delivers ${chip.ai_tops ?? '—'} TOPS with ${chip.tdp_watt ?? '—'}W TDP.`
              : 'Detailed specifications for this edge AI accelerator.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
            <div className="text-sm text-slate-500 mb-2">AI Throughput</div>
            <div className="text-3xl font-bold text-white">{chip.ai_tops || '—'}</div>
            <div className="text-sm text-slate-400 mt-1">TOPS</div>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
            <div className="text-sm text-slate-500 mb-2">Memory Capacity</div>
            <div className="text-3xl font-bold text-white">{chip.vram_gb || '—'}</div>
            <div className="text-sm text-slate-400 mt-1">GB</div>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
            <div className="text-sm text-slate-500 mb-2">Power Draw</div>
            <div className="text-3xl font-bold text-white">{chip.tdp_watt || '—'}</div>
            <div className="text-sm text-slate-400 mt-1">Watts TDP</div>
          </div>
        </div>

        {perfPerDollar && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 mb-12">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-emerald-400 mb-1">AI TOPS per Dollar</div>
                <div className="text-2xl font-bold text-emerald-300">{perfPerDollar} TOPS / $</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-500">Based on list price</div>
                <div className="text-xs text-slate-600">Subject to market fluctuation</div>
              </div>
            </div>
          </div>
        )}

        <ChipBenchmarkPanel rows={benchmarks} benchmarkCategoryHref={getBenchmarkCategoryHref(benchmarks[0]?.modelCategory)} />

        <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden mb-12">
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50">
            <h2 className="text-lg font-semibold">Specifications</h2>
          </div>
          <div className="divide-y divide-slate-800">
            {specs.map((spec) => (
              <div
                key={spec.label}
                className="flex items-center justify-between px-6 py-4 hover:bg-slate-900/30 transition"
              >
                <span className="text-slate-400 text-sm">{spec.label}</span>
                <span className="text-slate-200 font-medium">{spec.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/edge"
            className="px-6 py-3 bg-slate-900 border border-slate-700 text-white rounded-full hover:border-emerald-500 transition font-medium"
          >
            ← Back to Edge Database
          </Link>
          <Link
            href={`/edge?items=${encodeURIComponent(serializeCompareItems([{ id: chip.id, source: 'edge' }]))}`}
            className="px-6 py-3 bg-emerald-500 text-black rounded-full hover:bg-emerald-400 transition font-bold"
          >
            Continue Comparing
          </Link>
        </div>
      </div>
    </main>
  );
}
