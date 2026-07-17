import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { supabase } from '@/lib/supabase';

export type BenchmarkCategory = 'vision' | 'speech' | 'llm';

type BenchmarkCategoryConfig = {
  slug: BenchmarkCategory;
  title: string;
  shortLabel: string;
  description: string;
  focus: string;
  emptyLabel: string;
};

type BenchmarkChipRow = {
  id: string;
  source: 'cloud' | 'edge';
  href: string;
  name: string;
  manufacturer: string | null;
  category: string | null;
  primaryMetric: string;
  modelCount: number;
};

export const benchmarkCategoryConfig: Record<BenchmarkCategory, BenchmarkCategoryConfig> = {
  vision: {
    slug: 'vision',
    title: 'Vision Model Performance',
    shortLabel: 'Vision',
    description:
      'Track how different chips perform on image classification, detection, segmentation, multimodal vision, and related inference workloads.',
    focus: 'CV models, multimodal vision, and image-heavy inference pipelines',
    emptyLabel: 'Vision model benchmark data has not been added yet.',
  },
  speech: {
    slug: 'speech',
    title: 'Speech Model Performance',
    shortLabel: 'Speech',
    description:
      'Track chip performance on ASR, TTS, speech enhancement, and latency-sensitive voice workloads across cloud and edge environments.',
    focus: 'ASR, TTS, streaming speech, and audio inference workloads',
    emptyLabel: 'Speech model benchmark data has not been added yet.',
  },
  llm: {
    slug: 'llm',
    title: 'LLM Model Performance',
    shortLabel: 'LLM',
    description:
      'Track throughput, latency, memory fit, and deployment readiness for large language models and instruction-tuned inference stacks.',
    focus: 'Prompt throughput, generation latency, context fit, and serving readiness',
    emptyLabel: 'LLM benchmark data has not been added yet.',
  },
};

function formatPrimaryMetric(
  source: 'cloud' | 'edge',
  values: { fp16_tflops?: number | null; ai_tops?: number | null }
) {
  if (source === 'edge') {
    return values.ai_tops == null ? '—' : `${values.ai_tops.toLocaleString()} TOPS`;
  }

  return values.fp16_tflops == null ? '—' : `${values.fp16_tflops.toLocaleString()} TFLOPS`;
}

async function fetchBenchmarkRows(): Promise<BenchmarkChipRow[]> {
  const [{ data: cloudChips }, { data: edgeChips }] = await Promise.all([
    supabase
      .from('cloud_chips')
      .select('id,name,manufacturer,category,fp16_tflops')
      .order('name', { ascending: true }),
    supabase
      .from('edge_chips')
      .select('id,name,manufacturer,category,ai_tops')
      .order('name', { ascending: true }),
  ]);

  const cloudRows: BenchmarkChipRow[] = (cloudChips ?? []).map((chip) => ({
    id: chip.id,
    source: 'cloud',
    href: `/chips/${chip.id}`,
    name: chip.name,
    manufacturer: chip.manufacturer,
    category: chip.category,
    primaryMetric: formatPrimaryMetric('cloud', { fp16_tflops: chip.fp16_tflops }),
    modelCount: 0,
  }));

  const edgeRows: BenchmarkChipRow[] = (edgeChips ?? []).map((chip) => ({
    id: chip.id,
    source: 'edge',
    href: `/edge/${chip.id}`,
    name: chip.name,
    manufacturer: chip.manufacturer,
    category: chip.category,
    primaryMetric: formatPrimaryMetric('edge', { ai_tops: chip.ai_tops }),
    modelCount: 0,
  }));

  return [...cloudRows, ...edgeRows];
}

export default async function BenchmarkCategoryPage({
  category,
}: {
  category: BenchmarkCategory;
}) {
  const config = benchmarkCategoryConfig[category];
  const chips = await fetchBenchmarkRows();
  const trackedModelCount = 0;

  return (
    <main className="min-h-screen bg-black text-white">
      <SiteHeader
        cta={{ href: '/collections', label: 'My Collections' }}
        secondaryLink={{ href: '/', label: 'Back to Home' }}
      />

      <section className="px-6 pt-24 pb-12">
        <div className="max-w-6xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 bg-slate-900/80 border border-slate-800 rounded-full text-sm text-emerald-400">
            <span className="w-2 h-2 bg-emerald-500 rounded-full" />
            Model Performance Benchmark
          </div>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-5">{config.title}</h1>
          <p className="text-lg text-slate-400 max-w-3xl leading-relaxed mb-8">{config.description}</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
              <div className="text-sm text-slate-500 mb-2">Benchmark Focus</div>
              <div className="text-lg font-semibold text-white">{config.focus}</div>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
              <div className="text-sm text-slate-500 mb-2">Tracked Models</div>
              <div className="text-3xl font-bold text-white">{trackedModelCount}</div>
              <div className="text-sm text-slate-400 mt-2">No benchmark records yet</div>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
              <div className="text-sm text-slate-500 mb-2">Chips Listed</div>
              <div className="text-3xl font-bold text-white">{chips.length}</div>
              <div className="text-sm text-slate-400 mt-2">Cloud and Edge chips combined</div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5">
            <div className="text-sm font-medium text-amber-300 mb-1">Data status</div>
            <p className="text-sm text-slate-300">
              {config.emptyLabel} This page is already wired to the chip catalog so benchmark rows can be populated as
              soon as model-level results are added to the database.
            </p>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-950">
                  <th className="text-left p-4 text-slate-500 font-medium border-b border-slate-800">Chip</th>
                  <th className="text-left p-4 text-slate-500 font-medium border-b border-slate-800">Segment</th>
                  <th className="text-left p-4 text-slate-500 font-medium border-b border-slate-800">Manufacturer</th>
                  <th className="text-left p-4 text-slate-500 font-medium border-b border-slate-800">Primary Metric</th>
                  <th className="text-left p-4 text-slate-500 font-medium border-b border-slate-800">Models Tracked</th>
                  <th className="text-left p-4 text-slate-500 font-medium border-b border-slate-800">Status</th>
                </tr>
              </thead>
              <tbody>
                {chips.map((chip) => (
                  <tr key={`${chip.source}:${chip.id}`} className="border-b border-slate-800/50 hover:bg-slate-900/30 transition">
                    <td className="p-4">
                      <Link href={chip.href} className="text-white font-medium hover:text-emerald-400 transition">
                        {chip.name}
                      </Link>
                      <div className="text-xs text-slate-500 mt-1">{chip.category ?? '—'}</div>
                    </td>
                    <td className="p-4 text-slate-300">{chip.source === 'cloud' ? 'Cloud' : 'Edge'}</td>
                    <td className="p-4 text-slate-300">{chip.manufacturer ?? '—'}</td>
                    <td className="p-4 text-slate-300">{chip.primaryMetric}</td>
                    <td className="p-4 text-slate-300">{chip.modelCount}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-xs text-slate-400">
                        Pending benchmark data
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/chips"
              className="px-6 py-3 bg-emerald-500 text-black rounded-full hover:bg-emerald-400 transition font-semibold"
            >
              Browse Cloud Chips
            </Link>
            <Link
              href="/edge"
              className="px-6 py-3 border border-slate-700 text-white rounded-full hover:border-emerald-500 transition font-medium"
            >
              Browse Edge Chips
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
