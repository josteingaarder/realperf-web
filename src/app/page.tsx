'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getFavorites, getSavedComparisons } from '@/lib/storage';
import { supabase } from '@/lib/supabase';

interface Chip {
  id: string;
  name: string;
  manufacturer: string;
  category: string;
  fp16_tflops: number;
}

export default function Home() {
  const [favChips, setFavChips] = useState<Chip[]>([]);
  const [savedComps, setSavedComps] = useState(getSavedComparisons());

  useEffect(() => {
    const favIds = getFavorites();
    if (favIds.length > 0) {
      supabase.from('chips').select('id,name,manufacturer,category,fp16_tflops').in('id', favIds).then(({ data }) => {
        setFavChips(data || []);
      });
    }
    setSavedComps(getSavedComparisons());
  }, []);

  return (
    <main className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* 双层荧光绿科技光晕 */}
      <div className="absolute top-[-80px] left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-emerald-500/20 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[40px] left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-emerald-400/35 rounded-full blur-[60px] pointer-events-none" />

      {/* 导航栏 */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              RealPerf<span className="text-emerald-400">.ai</span>
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <Link href="/chips" className="hover:text-white transition">Chips</Link>
            <Link href="/chips" className="hover:text-white transition">Compare</Link>
            <Link href="/collections" className="hover:text-white transition">My Collections</Link>
          </div>

          <Link 
            href="/chips"
            className="text-sm font-medium px-4 py-2 bg-emerald-500 text-black rounded-full hover:bg-emerald-400 transition font-semibold"
          >
            Explore Chips
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900/80 border border-slate-800 rounded-full text-sm text-emerald-400 mb-8">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            27+ AI Accelerators with Real Benchmarks
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            <span className="text-white">Silicon built for real</span>
            <br />
            <span className="text-emerald-400">AI performance</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            RealPerf aggregates benchmarks, specs, and real-world performance data for AI accelerators — 
            so you can compare H100, MI300X, Ascend, and more at a glance.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link 
              href="/chips"
              className="group flex items-center gap-2 px-6 py-3 bg-emerald-500 text-black rounded-full hover:bg-emerald-400 transition font-semibold"
            >
              Explore Chips
              <svg className="w-4 h-4 group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link 
              href="/chips"
              className="px-6 py-3 border border-slate-700 text-slate-300 rounded-full hover:border-slate-500 hover:bg-slate-900 transition font-medium"
            >
              Start Comparing
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              MLPerf & Standard Benchmarks
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              27+ AI Accelerators
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Side-by-Side Comparison
            </div>
          </div>
        </div>
      </section>

      {/* 核心功能入口 */}
      <section className="px-6 pb-12">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/chips" className="group bg-slate-950 border border-slate-800 rounded-xl p-8 hover:border-emerald-500/50 transition">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Chip Database</h3>
              <p className="text-sm text-slate-400">Browse 27+ AI accelerators from NVIDIA, AMD, Intel, Huawei, and more. Filter by specs and price.</p>
            </Link>

            <Link href="/chips" className="group bg-slate-950 border border-slate-800 rounded-xl p-8 hover:border-emerald-500/50 transition">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Compare & Chart</h3>
              <p className="text-sm text-slate-400">Select up to 4 chips and compare FP16 performance, price, and specs side by side with interactive charts.</p>
            </Link>

            <Link href="/chips" className="group bg-slate-950 border border-slate-800 rounded-xl p-8 hover:border-emerald-500/50 transition">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Real Benchmarks</h3>
              <p className="text-sm text-slate-400">MLPerf Training & Inference results. See how chips perform on ResNet-50, BERT, and LLM workloads.</p>
            </Link>
          </div>
        </div>
      </section>

      {/* 我的收藏（仅在有数据时显示） */}
      {(favChips.length > 0 || savedComps.length > 0) && (
        <section className="px-6 pb-12">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">My Collections</h2>
              <Link href="/collections" className="text-sm text-emerald-400 hover:underline">View All</Link>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {favChips.slice(0, 3).map((chip) => (
                <Link 
                  key={chip.id} 
                  href={`/chips/${chip.id}`}
                  className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl hover:border-emerald-500/50 transition"
                >
                  <div>
                    <div className="text-sm text-emerald-400 font-semibold">{chip.manufacturer}</div>
                    <div className="text-white font-medium">{chip.name}</div>
                  </div>
                  <div className="text-sm text-slate-500">{chip.fp16_tflops} TFLOPS</div>
                </Link>
              ))}
              
              {savedComps.slice(0, 2).map((comp, i) => (
                <Link 
                  key={i} 
                  href={`/compare?ids=${comp.ids.join(',')}`}
                  className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-xl hover:border-emerald-500/50 transition"
                >
                  <div>
                    <div className="text-sm text-slate-500">Saved Comparison</div>
                    <div className="text-white font-medium text-sm truncate max-w-[200px]">{comp.names.join(' vs ')}</div>
                  </div>
                  <div className="text-xs text-emerald-400">Compare →</div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 数据仪表盘预览 */}
      <section className="px-6 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl shadow-emerald-500/5 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="ml-3 text-sm text-slate-500 font-mono">realperf.ai / chip-comparison</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded-full border border-emerald-500/20">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                Live Data
              </div>
            </div>
            
            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800">
                <div className="text-sm text-slate-500 mb-2">FP16 Peak Performance</div>
                <div className="text-3xl font-bold text-white">1,979 <span className="text-lg text-slate-600">TFLOPS</span></div>
                <div className="text-sm text-emerald-400 mt-2 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  H100 SXM5
                </div>
              </div>
              
              <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800">
                <div className="text-sm text-slate-500 mb-2">Memory Bandwidth</div>
                <div className="text-3xl font-bold text-white">3.35 <span className="text-lg text-slate-600">TB/s</span></div>
                <div className="text-sm text-emerald-400 mt-2 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  H200
                </div>
              </div>
              
              <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800">
                <div className="text-sm text-slate-500 mb-2">Chips in Database</div>
                <div className="text-3xl font-bold text-white">27+</div>
                <div className="text-sm text-emerald-400 mt-2">NVIDIA, AMD, Intel, Huawei...</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 底部 CTA */}
      <section className="px-6 pb-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to find the right chip?</h2>
          <p className="text-slate-400 mb-8">Compare AI accelerators side by side and make data-driven decisions.</p>
          <Link 
            href="/chips"
            className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 text-black rounded-full hover:bg-emerald-400 transition font-bold text-lg"
          >
            Explore the Database
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>
    </main>
  );
}
