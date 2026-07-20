import { Suspense } from 'react';
import Link from 'next/link';
import SiteHeaderWithAuth from '@/components/SiteHeaderWithAuth';
import BenchmarkResultsExplorer from '@/app/benchmark/BenchmarkResultsExplorer';
import { fetchPublicBenchmarkRows, type BenchmarkCategory } from '@/lib/public-benchmarks';

type BenchmarkCategoryConfig = {
  slug: BenchmarkCategory;
  title: string;
  shortLabel: string;
  description: string;
  focus: string;
  emptyLabel: string;
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

export default async function BenchmarkCategoryPage({
  category,
}: {
  category: BenchmarkCategory;
}) {
  const config = benchmarkCategoryConfig[category];
  const rows = await fetchPublicBenchmarkRows(category);
  const trackedModels = new Set(rows.map((row) => row.modelId).filter(Boolean)).size;
  const comparableProfiles = new Set(rows.map((row) => row.scenarioId)).size;

  return (
    <main className="min-h-screen bg-black text-white">
      <SiteHeaderWithAuth
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
              <div className="text-sm text-slate-500 mb-2">Benchmark Focus</div>
              <div className="text-lg font-semibold text-white">{config.focus}</div>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6">
              <div className="text-sm text-slate-500 mb-2">Comparison Coverage</div>
              <div className="text-3xl font-bold text-white">
                {trackedModels} models / {comparableProfiles} profiles
              </div>
              <div className="text-sm text-slate-400 mt-2">Choose one model and one shared test condition to compare chips side by side</div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="max-w-6xl mx-auto">
          {rows.length > 0 ? (
            <Suspense
              fallback={
                <div className="rounded-2xl border border-slate-800 bg-slate-950 p-6 text-sm text-slate-400">
                  Loading benchmark controls...
                </div>
              }
            >
              <BenchmarkResultsExplorer category={category} rows={rows} />
            </Suspense>
          ) : (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5">
              <div className="text-sm font-medium text-amber-300 mb-1">Data status</div>
              <p className="text-sm text-slate-300">{config.emptyLabel}</p>
            </div>
          )}

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
