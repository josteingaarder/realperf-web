import Link from 'next/link';

export default async function StatsCards() {
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
    <div className="grid grid-cols-1 gap-6 p-8 md:grid-cols-3">
      {cards.map((card) => (
        <Link
          key={card.title}
          href={card.href}
          className="group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 px-8 py-9 text-center hover:border-emerald-500/30 hover:-translate-y-1 transition-all duration-300"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.14),transparent_58%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative flex min-h-[170px] flex-col items-center justify-center">
            <div className="text-[2rem] font-bold tracking-tight text-white">{card.title}</div>
            <div className="mt-4 text-sm font-medium text-emerald-400">{trackedModelCount} models tracked</div>
            <div className="mt-6 max-w-[15rem] text-base leading-7 text-slate-400">{card.accent}</div>
          </div>
        </Link>
      ))}
    </div>
  );
}
