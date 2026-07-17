import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { supabase } from '@/lib/supabase';
import { serializeCompareItems } from '@/lib/storage';

export const metadata: Metadata = {
  title: 'Chip of the Day | RealPerf.ai',
  description:
    'Discover a daily featured AI chip with specs, positioning, and quick actions for deeper comparison.',
};

function getDayIndex(length: number) {
  const today = new Date();
  const seed = Number(
    `${today.getUTCFullYear()}${String(today.getUTCMonth() + 1).padStart(2, '0')}${String(
      today.getUTCDate()
    ).padStart(2, '0')}`
  );

  return seed % length;
}

export default async function ChipOfTheDayPage() {
  const { data: chips, error } = await supabase
    .from('cloud_chips')
    .select(
      'id,name,manufacturer,category,architecture,vram_gb,tdp_watt,fp16_tflops,fp32_tflops,price_usd,process_node'
    )
    .order('name', { ascending: true });

  if (error || !chips || chips.length === 0) {
    return (
      <main className="min-h-screen bg-black text-white">
        <SiteHeader cta={{ href: '/collections', label: 'My Collections' }} />
        <div className="flex items-center justify-center px-6 py-24">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Chip of the Day is unavailable</h1>
            <p className="text-slate-500 mb-6">
              We could not load the featured chip right now. Please try again later.
            </p>
            <Link href="/chips" className="text-emerald-400 hover:underline">
              Browse the chip database
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const chip = chips[getDayIndex(chips.length)];
  const perfPerDollar =
    chip.fp16_tflops && chip.price_usd ? (chip.fp16_tflops / chip.price_usd).toFixed(2) : null;

  const highlights = [
    { label: 'FP16 Performance', value: chip.fp16_tflops ? `${chip.fp16_tflops} TFLOPS` : '—' },
    { label: 'Memory Capacity', value: chip.vram_gb ? `${chip.vram_gb} GB` : '—' },
    { label: 'Power Draw', value: chip.tdp_watt ? `${chip.tdp_watt} W` : '—' },
    { label: 'Process Node', value: chip.process_node ?? '—' },
  ];

  return (
    <main className="min-h-screen bg-black text-white relative overflow-hidden">
      <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[860px] h-[420px] bg-emerald-500/15 rounded-full blur-[140px] pointer-events-none" />

      <SiteHeader cta={{ href: '/collections', label: 'My Collections' }} />

      <section className="relative px-6 pt-24 pb-14">
        <div className="max-w-6xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 bg-slate-900/80 border border-slate-800 rounded-full text-sm text-emerald-400">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Daily Spotlight
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-10 items-start">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-sm font-bold text-emerald-400 tracking-wide uppercase">
                  {chip.manufacturer}
                </span>
                <span className="text-xs text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                  {chip.category}
                </span>
              </div>

              <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-5">{chip.name}</h1>

              <p className="text-lg text-slate-400 max-w-3xl leading-relaxed mb-8">
                {chip.architecture
                  ? `${chip.name} is today’s featured chip for its balance of ${chip.fp16_tflops ?? '—'} TFLOPS compute, ${chip.vram_gb ?? '—'}GB memory, and a ${chip.architecture} software ecosystem.`
                  : `Today's featured chip highlights a practical balance of compute, memory capacity, and deployment readiness for modern AI workloads.`}
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  href={`/chips/${chip.id}`}
                  className="px-6 py-3 bg-emerald-500 text-black rounded-full hover:bg-emerald-400 transition font-semibold"
                >
                  View Full Profile
                </Link>
                <Link
                  href={`/chips?items=${encodeURIComponent(
                    serializeCompareItems([{ id: chip.id, source: 'cloud' }])
                  )}`}
                  className="px-6 py-3 border border-slate-700 text-white rounded-full hover:border-emerald-500 transition font-medium"
                >
                  Add to Comparison
                </Link>
              </div>
            </div>

            <div className="bg-slate-950/95 border border-slate-800 rounded-2xl p-8">
              <div className="text-sm uppercase tracking-[0.24em] text-emerald-400 mb-4">
                Why this chip today
              </div>
              <div className="space-y-4">
                {highlights.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between border-b border-slate-800/70 pb-4 last:border-b-0 last:pb-0"
                  >
                    <span className="text-slate-400">{item.label}</span>
                    <span className="text-white font-medium">{item.value}</span>
                  </div>
                ))}
              </div>

              {perfPerDollar ? (
                <div className="mt-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-5">
                  <div className="text-sm text-emerald-400 mb-1">Performance per Dollar</div>
                  <div className="text-2xl font-bold text-emerald-300">{perfPerDollar} TFLOPS / $</div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
            <div className="text-sm text-slate-500 mb-2">Best next step</div>
            <div className="text-xl font-semibold mb-2">Compare it against peers</div>
            <p className="text-sm text-slate-400 leading-6">
              Place today’s chip beside other accelerators to compare compute, memory, and pricing tradeoffs.
            </p>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
            <div className="text-sm text-slate-500 mb-2">Explore deeper</div>
            <div className="text-xl font-semibold mb-2">Review the full profile</div>
            <p className="text-sm text-slate-400 leading-6">
              Jump to the detailed chip page for specifications, benchmark results, and product positioning.
            </p>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
            <div className="text-sm text-slate-500 mb-2">Keep browsing</div>
            <div className="text-xl font-semibold mb-2">See the full database</div>
            <p className="text-sm text-slate-400 leading-6">
              Continue browsing cloud accelerators if you want a wider shortlist beyond today’s recommendation.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
