import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import ChipSelector from './ChipSelector';

export default async function ChipsPage() {
  const { data: chips, error } = await supabase
    .from('chips')
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

      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">AI Chip Database</h1>
            <p className="text-sm text-slate-500 mt-1">点击卡片选择芯片，最多 4 款</p>
          </div>
        </div>
        <ChipSelector chips={chips} />
      </div>
    </main>
  );
}