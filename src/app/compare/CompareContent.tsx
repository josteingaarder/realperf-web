'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import ReactECharts from 'echarts-for-react';
import { saveComparison, getSavedComparisons } from '@/lib/storage';

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

export default function CompareContent() {
  const searchParams = useSearchParams();
  const ids = searchParams.get('ids')?.split(',').filter(Boolean) || [];
  const [chips, setChips] = useState<Chip[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedMsg, setSavedMsg] = useState('');

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

  const handleSave = () => {
    if (chips.length < 2) return;
    const names = chips.map(c => c.name);
    const idsArr = chips.map(c => c.id);
    saveComparison(idsArr, names);
    setSavedMsg('Comparison saved to My Collections!');
    setTimeout(() => setSavedMsg(''), 3000);
  };

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

  const chartOption = {
    backgroundColor: 'transparent',
    title: {
      text: 'FP16 Performance Comparison',
      left: 'center',
      textStyle: { color: '#94a3b8', fontSize: 16, fontWeight: 'normal' }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: '#0f172a',
      borderColor: '#334155',
      textStyle: { color: '#e2e8f0' }
    },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      data: chips.map(c => c.name),
      axisLine: { lineStyle: { color: '#334155' } },
      axisLabel: { color: '#94a3b8', rotate: 30, fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      name: 'TFLOPS',
      nameTextStyle: { color: '#64748b' },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#1e293b' } },
      axisLabel: { color: '#64748b' }
    },
    series: [{
      name: 'FP16 TFLOPS',
      type: 'bar',
      data: chips.map(c => c.fp16_tflops),
      itemStyle: {
        color: '#10b981',
        borderRadius: [6, 6, 0, 0]
      },
      barWidth: '40%',
      label: {
        show: true,
        position: 'top',
        color: '#34d399',
        fontSize: 12,
        formatter: '{c}'
      }
    }]
  };

  const pricePerfOption = {
    backgroundColor: 'transparent',
    title: {
      text: 'Performance per Dollar',
      left: 'center',
      textStyle: { color: '#94a3b8', fontSize: 16, fontWeight: 'normal' }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#0f172a',
      borderColor: '#334155',
      textStyle: { color: '#e2e8f0' },
      formatter: (params: any) => {
        const chip = chips[params[0].dataIndex];
        return `${chip.name}<br/>${chip.fp16_tflops} TFLOPS / $${chip.price_usd?.toLocaleString()}<br/>Ratio: ${params[0].value} TFLOPS/$`;
      }
    },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      data: chips.map(c => c.name),
      axisLine: { lineStyle: { color: '#334155' } },
      axisLabel: { color: '#94a3b8', rotate: 30, fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      name: 'TFLOPS / $',
      nameTextStyle: { color: '#64748b' },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#1e293b' } },
      axisLabel: { color: '#64748b' }
    },
    series: [{
      name: 'Perf/$',
      type: 'bar',
      data: chips.map(c => c.price_usd ? +(c.fp16_tflops / c.price_usd).toFixed(3) : 0),
      itemStyle: {
        color: '#06b6d4',
        borderRadius: [6, 6, 0, 0]
      },
      barWidth: '40%',
      label: {
        show: true,
        position: 'top',
        color: '#22d3ee',
        fontSize: 12,
        formatter: (p: any) => p.value
      }
    }]
  };

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
          <div className="flex items-center gap-4">
            <Link href="/collections" className="text-sm text-slate-400 hover:text-white transition">My Collections</Link>
            <Link href="/chips" className="text-sm font-medium text-slate-400 hover:text-white transition">
              ← 返回列表
            </Link>
          </div>
        </div>
      </nav>

      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold">Chip Comparison</h1>
            <p className="text-slate-500">并排对比各款 AI 加速器的核心参数</p>
          </div>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-slate-900 border border-slate-700 text-emerald-400 rounded-full hover:border-emerald-500 transition text-sm font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
            Save Comparison
          </button>
        </div>
        
        {savedMsg && (
          <div className="mb-4 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm">
            {savedMsg}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
            <ReactECharts option={chartOption} style={{ height: '320px' }} />
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
            <ReactECharts option={pricePerfOption} style={{ height: '320px' }} />
          </div>
        </div>

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
