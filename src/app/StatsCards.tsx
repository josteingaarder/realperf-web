import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default async function StatsCards() {
  const [{ count: cloudCount }, { count: edgeCount }] = await Promise.all([
    supabase.from('cloud_chips').select('*', { count: 'exact', head: true }),
    supabase.from('edge_chips').select('*', { count: 'exact', head: true }),
  ]);

  const totalChipCount = (cloudCount ?? 0) + (edgeCount ?? 0);
  const trackedModelCount = 0;

  const cards = [
    {
      title: 'Vision',
      href: '/benchmark/vision',
      accent: 'Computer vision and multimodal image workloads',
    },
    {
      title: 'Speech',
      href: '/benchmark/speech',
      accent: 'ASR, TTS, and real-time audio inference',
    },
    {
      title: 'LLM',
      href: '/benchmark/llm',
      accent: 'Prompt throughput, latency, and memory fit',
    },
  ];

  return (
    <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
      {cards.map((card) => (
        <Link
          key={card.title}
          href={card.href}
          className="group relative overflow-hidden p-6 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-emerald-500/30 transition-all duration-300 text-center"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.14),transparent_58%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative flex min-h-[126px] flex-col items-center justify-center">
            <div className="text-3xl font-bold text-white tracking-tight">{card.title}</div>
            <div className="mt-3 text-sm font-medium text-emerald-400">{trackedModelCount} models tracked</div>
            <div className="mt-3 text-sm text-slate-500 max-w-[18rem]">{card.accent}</div>
            <div className="mt-4 text-xs uppercase tracking-[0.2em] text-slate-600">
              {totalChipCount} chips ready for benchmarking
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
