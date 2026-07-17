'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ReactECharts from 'echarts-for-react';
import SiteHeader from '@/components/SiteHeader';
import { fetchCompareChips, getSourceLabel, type CompareChip } from '@/lib/catalog';
import {
  parseCompareItems,
  saveComparison,
  serializeCompareItems,
} from '@/lib/storage';

function getPrimaryMetric(chip: CompareChip) {
  if (chip.source === 'edge') {
    return {
      label: 'AI TOPS',
      unit: 'TOPS',
      value: chip.ai_tops ?? 0,
    };
  }

  return {
    label: 'FP16 TFLOPS',
    unit: 'TFLOPS',
    value: chip.fp16_tflops ?? 0,
  };
}

function formatValue(value: number | string | null | undefined, suffix = '') {
  if (value == null || value === '') return '—';

  if (typeof value === 'number') {
    return `${value.toLocaleString()}${suffix}`;
  }

  return `${value}${suffix}`;
}

export default function CompareContent() {
  const searchParams = useSearchParams();
  const compareItems = useMemo(
    () => parseCompareItems(searchParams.get('items'), searchParams.get('ids')),
    [searchParams]
  );
  const compareKey = useMemo(() => serializeCompareItems(compareItems), [compareItems]);
  const [result, setResult] = useState<{ key: string; chips: CompareChip[] }>({
    key: '',
    chips: [],
  });
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    if (compareItems.length < 2) return;

    fetchCompareChips(compareItems).then((data) => {
      setResult({ key: compareKey, chips: data });
    });
  }, [compareItems, compareKey]);

  const loading = compareItems.length >= 2 && result.key !== compareKey;
  const chips = result.key === compareKey ? result.chips : [];

  const handleSave = () => {
    if (chips.length < 2) return;
    const names = chips.map((chip) => chip.name);
    saveComparison(compareItems, names);
    setSavedMsg('Comparison saved to My Collections!');
    setTimeout(() => setSavedMsg(''), 3000);
  };

  const hasMixedSources = new Set(chips.map((chip) => chip.source)).size > 1;
  const allEdge = chips.length > 0 && chips.every((chip) => chip.source === 'edge');

  if (compareItems.length < 2) {
    return (
      <main className="min-h-screen bg-black text-white">
        <SiteHeader secondaryLink={{ href: '/chips', label: 'Back to Cloud Database' }} />
        <div className="flex items-center justify-center px-6 py-24">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Select at least 2 chips to compare</h1>
            <p className="text-slate-500 mb-6">Start with one chip from the Cloud or Edge database, then add more to complete the comparison.</p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/chips" className="text-emerald-400 hover:underline">
                Browse Cloud Chips
              </Link>
              <Link href="/edge" className="text-emerald-400 hover:underline">
                Browse Edge Chips
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-slate-500">Loading comparison data...</div>
      </main>
    );
  }

  if (!chips || chips.length === 0) {
    return (
      <main className="min-h-screen bg-black text-white">
        <SiteHeader secondaryLink={{ href: '/chips', label: 'Back to Cloud Database' }} />
        <div className="flex items-center justify-center px-6 py-24">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Chip data not found</h1>
            <Link href="/chips" className="text-emerald-400 hover:underline">
              Back to chip database
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const primarySeries = chips.map((chip) => getPrimaryMetric(chip).value);
  const chartOption = {
    backgroundColor: 'transparent',
    title: {
      text: hasMixedSources
        ? 'Primary Performance Comparison'
        : allEdge
          ? 'AI TOPS Comparison'
          : 'FP16 Performance Comparison',
      left: 'center',
      textStyle: { color: '#94a3b8', fontSize: 16, fontWeight: 'normal' },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: '#0f172a',
      borderColor: '#334155',
      textStyle: { color: '#e2e8f0' },
      formatter: (params: Array<{ dataIndex: number; value: number }>) => {
        const chip = chips[params[0].dataIndex];
        const metric = getPrimaryMetric(chip);
        return `${chip.name}<br/>${metric.label}: ${metric.value.toLocaleString()} ${metric.unit}`;
      },
    },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      data: chips.map((chip) => chip.name),
      axisLine: { lineStyle: { color: '#334155' } },
      axisLabel: { color: '#94a3b8', rotate: 30, fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      name: allEdge ? 'TOPS' : hasMixedSources ? 'Performance' : 'TFLOPS',
      nameTextStyle: { color: '#64748b' },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#1e293b' } },
      axisLabel: { color: '#64748b' },
    },
    series: [
      {
        name: allEdge ? 'AI TOPS' : hasMixedSources ? 'Primary Metric' : 'FP16 TFLOPS',
        type: 'bar',
        data: primarySeries,
        itemStyle: {
          color: '#10b981',
          borderRadius: [6, 6, 0, 0],
        },
        barWidth: '40%',
        label: {
          show: true,
          position: 'top',
          color: '#34d399',
          fontSize: 12,
          formatter: '{c}',
        },
      },
    ],
  };

  const pricePerfOption = {
    backgroundColor: 'transparent',
    title: {
      text: hasMixedSources ? 'Primary Metric per Dollar' : 'Performance per Dollar',
      left: 'center',
      textStyle: { color: '#94a3b8', fontSize: 16, fontWeight: 'normal' },
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#0f172a',
      borderColor: '#334155',
      textStyle: { color: '#e2e8f0' },
      formatter: (params: Array<{ dataIndex: number; value: number }>) => {
        const chip = chips[params[0].dataIndex];
        const metric = getPrimaryMetric(chip);
        return `${chip.name}<br/>${metric.value.toLocaleString()} ${metric.unit} / $${chip.price_usd?.toLocaleString() ?? '—'}<br/>Ratio: ${params[0].value} ${metric.unit}/$`;
      },
    },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      data: chips.map((chip) => chip.name),
      axisLine: { lineStyle: { color: '#334155' } },
      axisLabel: { color: '#94a3b8', rotate: 30, fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      name: allEdge ? 'TOPS / $' : hasMixedSources ? 'Metric / $' : 'TFLOPS / $',
      nameTextStyle: { color: '#64748b' },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#1e293b' } },
      axisLabel: { color: '#64748b' },
    },
    series: [
      {
        name: 'Perf/$',
        type: 'bar',
        data: chips.map((chip) => {
          const metric = getPrimaryMetric(chip);
          return chip.price_usd ? +(metric.value / chip.price_usd).toFixed(3) : 0;
        }),
        itemStyle: {
          color: '#06b6d4',
          borderRadius: [6, 6, 0, 0],
        },
        barWidth: '40%',
        label: {
          show: true,
          position: 'top',
          color: '#22d3ee',
          fontSize: 12,
          formatter: (param: { value: number }) => param.value,
        },
      },
    ],
  };

  const attributes = [
    { label: 'Segment', render: (chip: CompareChip) => getSourceLabel(chip.source) },
    { label: 'Manufacturer', render: (chip: CompareChip) => chip.manufacturer },
    { label: 'Category', render: (chip: CompareChip) => chip.category },
    { label: 'Architecture', render: (chip: CompareChip) => chip.architecture ?? '—' },
    { label: 'Process Node', render: (chip: CompareChip) => chip.process_node ?? '—' },
    { label: 'VRAM', render: (chip: CompareChip) => formatValue(chip.vram_gb, ' GB') },
    { label: 'TDP', render: (chip: CompareChip) => formatValue(chip.tdp_watt, ' W') },
    { label: 'FP16', render: (chip: CompareChip) => formatValue(chip.fp16_tflops, ' TFLOPS') },
    { label: 'FP32', render: (chip: CompareChip) => formatValue(chip.fp32_tflops, ' TFLOPS') },
    { label: 'AI TOPS', render: (chip: CompareChip) => formatValue(chip.ai_tops, ' TOPS') },
    {
      label: 'Price',
      render: (chip: CompareChip) =>
        chip.price_usd == null ? '—' : `$${chip.price_usd.toLocaleString()}`,
    },
  ];

  return (
    <main className="min-h-screen bg-black text-white">
      <SiteHeader secondaryLink={{ href: '/chips', label: 'Back to Cloud Database' }} />

      <div className="p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold">Chip Comparison</h1>
            <p className="text-slate-500">Compare core specs and price efficiency across AI accelerators side by side.</p>
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

        {hasMixedSources && (
          <div className="mb-6 px-4 py-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl text-cyan-300 text-sm">
            This comparison includes both Cloud and Edge chips, so the charts use FP16 TFLOPS and AI TOPS as their primary metrics.
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
                    <div className="text-xs text-cyan-400 mb-1 uppercase">{getSourceLabel(chip.source)}</div>
                    <div className="text-sm text-emerald-400 mb-1">{chip.manufacturer}</div>
                    <div className="text-lg font-bold text-white">{chip.name}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {attributes.map((attr) => (
                <tr key={attr.label} className="border-b border-slate-800/50 hover:bg-slate-900/30 transition">
                  <td className="p-4 text-slate-400 font-medium sticky left-0 bg-black">{attr.label}</td>
                  {chips.map((chip) => (
                    <td key={`${chip.source}:${chip.id}:${attr.label}`} className="p-4 text-slate-200">
                      {attr.render(chip)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
