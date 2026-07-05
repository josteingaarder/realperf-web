import { supabase } from '@/lib/supabase';

export default async function StatsCards() {
  // 查询 FP16 最高的芯片
  const { data: topPerf } = await supabase
    .from('chips')
    .select('name,fp16_tflops')
    .order('fp16_tflops', { ascending: false })
    .limit(1)
    .single();

  // 查询显存最大的芯片
  const { data: topVram } = await supabase
    .from('chips')
    .select('name,vram_gb')
    .order('vram_gb', { ascending: false })
    .limit(1)
    .single();

  // 查询芯片总数
  const { count } = await supabase
    .from('chips')
    .select('*', { count: 'exact', head: true });

  return (
    <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800">
        <div className="text-sm text-slate-500 mb-2">Peak FP16 Performance</div>
        <div className="text-3xl font-bold text-white">
          {topPerf?.fp16_tflops?.toLocaleString() || '—'} <span className="text-lg text-slate-600">TFLOPS</span>
        </div>
        <div className="text-sm text-emerald-400 mt-2 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          {topPerf?.name || '—'}
        </div>
      </div>
      
      <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800">
        <div className="text-sm text-slate-500 mb-2">Max VRAM Capacity</div>
        <div className="text-3xl font-bold text-white">
          {topVram?.vram_gb || '—'} <span className="text-lg text-slate-600">GB</span>
        </div>
        <div className="text-sm text-emerald-400 mt-2 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          {topVram?.name || '—'}
        </div>
      </div>
      
      <div className="p-6 rounded-xl bg-slate-900/50 border border-slate-800">
        <div className="text-sm text-slate-500 mb-2">Chips in Database</div>
        <div className="text-3xl font-bold text-white">{count || 0}+</div>
        <div className="text-sm text-emerald-400 mt-2">NVIDIA, AMD, Intel, Huawei...</div>
      </div>
    </div>
  );
}
