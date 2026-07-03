import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default async function ChipsPage() {
  const { data: chips, error } = await supabase
    .from('chips')
    .select('*')
    .order('fp16_tflops', { ascending: false });

  if (error) {
    return (
      <main className="min-h-screen bg-slate-900 text-white p-8">
        <h1 className="text-3xl font-bold">Error loading chips</h1>
        <p className="text-slate-400">{error.message}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      {/* 导航栏 */}
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
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <Link href="/chips" className="text-white">Chips</Link>
            <Link href="/chips" className="hover:text-white transition">Compare</Link>
            <Link href="/chips" className="hover:text-white transition">Benchmarks</Link>
            <a href="#" className="hover:text-white transition">Docs</a>
          </div>

          <div className="flex items-center gap-3">
            <button className="hidden md:block text-sm font-medium text-slate-400 hover:text-white transition">
              Sign in
            </button>
            <Link 
              href="/chips"
              className="text-sm font-medium px-4 py-2 bg-emerald-500 text-black rounded-full hover:bg-emerald-400 transition font-semibold"
            >
              Explore Chips
            </Link>
          </div>
        </div>
      </nav>

      {/* 内容 */}
      <div className="p-8 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">AI Chip Database</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {chips?.map((chip) => (
            <div 
              key={chip.id} 
              className="bg-slate-950 p-6 rounded-xl border border-slate-800 hover:border-emerald-500/50 transition group"
            >
              <div className="flex justify-between items-start mb-2">
                <div className="text-sm text-emerald-400 font-semibold">{chip.manufacturer}</div>
                <div className="text-xs text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800">{chip.category}</div>
              </div>
              <h2 className="text-xl font-bold mb-4 text-white group-hover:text-emerald-400 transition">{chip.name}</h2>
              <div className="grid grid-cols-2 gap-3 text-sm text-slate-400">
                <div>VRAM: <span className="text-slate-200">{chip.vram_gb}GB</span></div>
                <div>TDP: <span className="text-slate-200">{chip.tdp_watt}W</span></div>
                <div>FP16: <span className="text-slate-200">{chip.fp16_tflops} TFLOPS</span></div>
                <div>FP32: <span className="text-slate-200">{chip.fp32_tflops} TFLOPS</span></div>
                <div className="col-span-2">Price: <span className="text-emerald-400">${chip.price_usd?.toLocaleString()}</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
