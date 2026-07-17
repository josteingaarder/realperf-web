'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  buildCompareHref,
  getFavorites,
  parseCompareItems,
  toggleFavorite,
} from '@/lib/storage';

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

export default function ChipFilter({ chips }: { chips: Chip[] }) {
  const searchParams = useSearchParams();
  const initialSelectedIds = useMemo(
    () =>
      parseCompareItems(searchParams.get('items'), searchParams.get('ids'))
        .filter((item) => item.source === 'cloud')
        .map((item) => item.id)
        .slice(0, 4),
    [searchParams]
  );
  const [search, setSearch] = useState('');
  const [manufacturer, setManufacturer] = useState('All');
  const [category, setCategory] = useState('All');
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelectedIds);
  const [favorites, setFavorites] = useState(getFavorites());
  const router = useRouter();

  const manufacturers = useMemo(() => 
    ['All', ...Array.from(new Set(chips.map(c => c.manufacturer))).sort()],
    [chips]
  );
  const categories = useMemo(() => 
    ['All', ...Array.from(new Set(chips.map(c => c.category))).sort()],
    [chips]
  );

  const filtered = useMemo(() => {
    return chips.filter(chip => {
      const matchSearch = search === '' || 
        chip.name.toLowerCase().includes(search.toLowerCase()) ||
        chip.manufacturer.toLowerCase().includes(search.toLowerCase());
      const matchMfr = manufacturer === 'All' || chip.manufacturer === manufacturer;
      const matchCat = category === 'All' || chip.category === category;
      return matchSearch && matchMfr && matchCat;
    });
  }, [chips, search, manufacturer, category]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(i => i !== id);
      if (prev.length >= 4) {
        window.alert('最多选择 4 款芯片对比');
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleToggleFavorite = (id: string) => {
    toggleFavorite({ id, source: 'cloud' });
    setFavorites(getFavorites());
  };

  const handleCompare = () => {
    if (selectedIds.length < 2) {
      window.alert('请至少选择 2 款芯片');
      return;
    }
    router.push(
      buildCompareHref(selectedIds.map((id) => ({ id, source: 'cloud' as const })))
    );
  };

  return (
    <div>
      {/* 筛选栏 */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search by name or manufacturer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <select
            value={manufacturer}
            onChange={(e) => setManufacturer(e.target.value)}
            className="px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500 transition appearance-none cursor-pointer min-w-[140px]"
          >
            {manufacturers.map(m => <option key={m} value={m}>{m}</option>)}
          </select>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-emerald-500 transition appearance-none cursor-pointer min-w-[120px]"
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="text-sm text-slate-500">
          Showing <span className="text-emerald-400 font-medium">{filtered.length}</span> of {chips.length} chips
          {search && <span className="ml-2">matching <span className="text-slate-300">{search}</span></span>}
        </div>
      </div>

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
        {filtered.map((chip) => {
          const isSelected = selectedIds.includes(chip.id);
          const isFav = favorites.some(
            (favorite) => favorite.id === chip.id && favorite.source === 'cloud'
          );
          return (
            <div 
              key={chip.id} 
              className={`relative rounded-xl border-2 transition-all ${
                isSelected 
                  ? 'bg-slate-900 border-emerald-500 shadow-lg shadow-emerald-500/20' 
                  : 'bg-slate-950 border-slate-800 hover:border-slate-500'
              }`}
            >
              {/* 心形收藏按钮 */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleToggleFavorite(chip.id);
                }}
                className="absolute top-4 right-14 z-20 w-8 h-8 rounded-full flex items-center justify-center transition"
                title={isFav ? 'Remove from favorites' : 'Add to favorites'}
              >
                <svg 
                  className={`w-5 h-5 transition ${isFav ? 'text-red-500 fill-current' : 'text-slate-600 hover:text-red-400'}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>

              {/* 选择勾选按钮 */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSelect(chip.id);
                }}
                className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition z-20 border-2 ${
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
              </button>

              <Link href={`/chips/${chip.id}`} className="block p-6">
                <div className="flex justify-between items-start mb-3 pr-20">
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

      {filtered.length === 0 && (
        <div className="text-center py-20">
          <div className="text-slate-500 text-lg mb-2">No chips found</div>
          <div className="text-slate-600 text-sm">Try adjusting your search or filters</div>
        </div>
      )}
    </div>
  );
}
