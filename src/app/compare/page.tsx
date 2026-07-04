'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Chip {
  id: string;
  name: string;
  manufacturer: string;
  category: string;
  architecture: string;
  vram_gb: number;
  tdp_watt: number;
  fp16_tflops: number;
  fp32_tflops: number;
  price_usd: number;
}

export default function ComparePage() {
  const searchParams = useSearchParams();
  const ids = searchParams.get('ids')?.split(',').filter(Boolean) || [];
  const [chips, setChips] = useState<Chip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (ids.length >= 2) {
      supabase
        .from('chips')
        .select('*')
        .in('id', ids)
        .then(({ data }) => {
          setChips(data || []);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [ids.join(',')]);

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-slate-500">Loading comparison data...</div>
      </main>
    );
  }

  if (ids.length < 2) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">请选择至少 2 款芯片对比</h1>
          <Link href="/chips" className="text-emerald-400 hover:underline">返回芯片列表</Link>
        </div>
      </main>
    );
  }

  if (!chips || chips.length === 0) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">未找到芯片数据</h1>
          <Link href="/chips" className="text-emerald-400 hover:underline">返回芯片列表</Link>
        </div>
      </main>
    );
  }

  const attributes = [
    { key: 'manufacturer', label: 'Manufacturer' },
    { key: 'category', label: 'Category' },
    { key: 'architecture', label: 'Architecture' },
    { key: 'vram_gb', label: 'VRAM', suffix: 'GB' },
    { key: 'tdp_watt', label: 'TDP', suffix: 'W' },
    { key: 'fp16_tflops', label: 'FP16', suffix: 'TFLOPS' },
    { key: 'fp32_tflops', label: 'FP32', suffix: 'TFLOPS' },
    { key: 'price_usd', label: 'Price', prefix: '$' },
  ];

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
          <Link href="/chips" className="text-sm font-medium text-slate-400 hover:text-white transition">
            ← 返回列表
          </Link>
        </div>
      </nav>

      <div className="p-8 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Chip Comparison</h1>
        <p className="text-slate-500 mb-8">并排对比各款 AI 加速器的核心参数</p>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-950">
                <th className="text-left p-4 text-slate-500 font-medium border-b border-slate-800 sticky left-0 bg-slate-950">Attribute</th>
                {chips.map((chip) => (
                  <th key={chip.id} className="text-left p-4 border-b border-slate-800 min-w-[180px]">
                    <div className="text-sm text-emerald-400 mb-1">{chip.manufacturer}</div>
                    <div className="text-lg font-bold text-white">{chip.name}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {attributes.map((attr) => (
                <tr key={attr.key} className="border-b border-slate-800/50 hover:bg-slate-900/30 transition">
                  <td className="p-4 text-slate-400 font-medium sticky left-0 bg-black">{attr.label}</td>
                  {chips.map((chip) => {
                    const value = chip[attr.key as keyof Chip];
                    const displayValue = attr.key === 'price_usd' 
                      ? `${attr.prefix || ''}${Number(value).toLocaleString()}`
                      : `${value}${attr.suffix || ''}`;
                    return (
                      <td key={chip.id} className="p-4 text-slate-200">
                        {displayValue}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}