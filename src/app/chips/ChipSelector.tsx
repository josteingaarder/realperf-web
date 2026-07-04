'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Chip {
  id: string;
  name: string;
  manufacturer: string;
  category: string;
  vram_gb: number;
  tdp_watt: number;
  fp16_tflops: number;
  fp32_tflops: number;
  price_usd: number;
}

export default function ChipSelector({ chips }: { chips: Chip[] }) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const router = useRouter();

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id);
      }
      if (prev.length >= 4) {
        window.alert('最多选择 4 款芯片对比');
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleCompare = () => {
    if (selectedIds.length < 2) {
      window.alert('请至少选择 2 款芯片');
      return;
    }
    router.push(`/compare?ids=${selectedIds.join(',')}`);
  };

  return (
    <div>
      {/* 底部浮动对比栏 */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 border-2 border-emerald-500 rounded-full px-6 py-3 flex items-center gap-4 shadow-2xl shadow-emerald-500/20">
          <span className="text-sm text-slate-300 font-medium">已选择 {selectedIds.length} 款</span>
          <button 
            onClick={handleCompare}
            className="px-5 py-2 bg-emerald-500 text-black text-sm font-bold rounded-full hover:bg-emerald-400 transition"
          >
            开始对比
          </button>
          <button 
            onClick={() => setSelectedIds([])}
            className="text-xs text-slate-500 hover:text-white underline"
          >
            清空
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-24">
        {chips.map((chip) => {
          const isSelected = selectedIds.includes(chip.id);
          return (
            <div 
              key={chip.id} 
              className={`relative rounded-xl border-2 transition-all ${
                isSelected 
                  ? 'bg-slate-900 border-emerald-500 shadow-lg shadow-emerald-500/20' 
                  : 'bg-slate-950 border-slate-800 hover:border-slate-500'
              }`}
            >
              {/* 选择勾选按钮 */}
              <div 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleSelect(chip.id);
                }}
                className={`absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition z-10 border-2 ${
                  isSelected 
                    ? 'bg-emerald-500 border-emerald-500' 
                    : 'bg-slate-900 border-slate-600 hover:border-emerald-500'
                }`}
              >
                {isSelected && (
                  <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>

              {/* 卡片主体点击跳转详情 */}
              <Link href={`/chips/${chip.id}`} className="block p-6">
                <div className="flex justify-between items-start mb-3 pr-10">
                  <div className="text-sm text-emerald-400 font-bold tracking-wide uppercase">{chip.manufacturer}</div>
                  <div className="text-xs text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800">{chip.category}</div>
                </div>
                
                <h2 className={`text-xl font-bold mb-4 ${isSelected ? 'text-emerald-300' : 'text-white'}`}>
                  {chip.name}
                </h2>
                
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="text-slate-500">VRAM: <span className="text-slate-200 font-medium">{chip.vram_gb}GB</span></div>
                  <div className="text-slate-500">TDP: <span className="text-slate-200 font-medium">{chip.tdp_watt}W</span></div>
                  <div className="text-slate-500">FP16: <span className="text-slate-200 font-medium">{chip.fp16_tflops} TFLOPS</span></div>
                  <div className="text-slate-500">FP32: <span className="text-slate-200 font-medium">{chip.fp32_tflops} TFLOPS</span></div>
                  <div className="col-span-2 text-slate-500">Price: <span className="text-emerald-400 font-bold">${chip.price_usd?.toLocaleString()}</span></div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}