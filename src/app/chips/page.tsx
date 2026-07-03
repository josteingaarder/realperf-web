import { supabase } from '@/lib/supabase';

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
    <main className="min-h-screen bg-slate-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8">AI Chip Database</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {chips?.map((chip) => (
          <div 
            key={chip.id} 
            className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-blue-500 transition"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="text-sm text-blue-400 font-semibold">{chip.manufacturer}</div>
              <div className="text-xs text-slate-500 bg-slate-700 px-2 py-1 rounded">{chip.category}</div>
            </div>
            <h2 className="text-xl font-bold mb-4">{chip.name}</h2>
            <div className="grid grid-cols-2 gap-3 text-sm text-slate-300">
              <div>VRAM: <span className="text-white">{chip.vram_gb}GB</span></div>
              <div>TDP: <span className="text-white">{chip.tdp_watt}W</span></div>
              <div>FP16: <span className="text-white">{chip.fp16_tflops} TFLOPS</span></div>
              <div>FP32: <span className="text-white">{chip.fp32_tflops} TFLOPS</span></div>
              <div className="col-span-2">Price: <span className="text-green-400">${chip.price_usd?.toLocaleString()}</span></div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}