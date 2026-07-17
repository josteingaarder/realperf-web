import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { serializeCompareItems } from '@/lib/storage';

export default async function ChipDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = params?.id;
  
  if (!id) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Missing chip ID</h1>
          <Link href="/chips" className="text-emerald-400 hover:underline">Back to chip database</Link>
        </div>
      </main>
    );
  }

  const { data: chip, error } = await supabase
    .from('cloud_chips')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !chip) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Chip not found</h1>
          <Link href="/chips" className="text-emerald-400 hover:underline">Back to chip database</Link>
        </div>
      </main>
    );
  }

  // 查询 benchmark 数据
  const { data: benchmarks } = await supabase
    .from('benchmarks')
    .select('*')
    .eq('chip_id', id)
    .order('benchmark_name');

  const perfPerDollar = chip.fp16_tflops && chip.price_usd 
    ? (chip.fp16_tflops / chip.price_usd).toFixed(2) 
    : null;

  const specs = [
    { label: 'Manufacturer', value: chip.manufacturer },
    { label: 'Category', value: chip.category },
    { label: 'Architecture', value: chip.architecture || '—' },
    { label: 'Process Node', value: chip.process_node || '—' },
    { label: 'Form Factor', value: chip.form_factor || '—' },
    { label: 'Cooling', value: chip.cooling_type || '—' },
    { label: 'VRAM', value: chip.vram_gb ? `${chip.vram_gb} GB` : '—' },
    { label: 'VRAM Type', value: chip.vram_type || '—' },
    { label: 'Interconnect Bandwidth', value: chip.interconnect_bandwidth_gb_s ? `${chip.interconnect_bandwidth_gb_s} GB/s` : '—' },
    { label: 'Tensor / Matrix Cores', value: chip.tensor_core_count ? chip.tensor_core_count.toLocaleString() : '—' },
    { label: 'Supported Precisions', value: chip.supported_precisions || '—' },
    { label: 'TDP', value: chip.tdp_watt ? `${chip.tdp_watt} W` : '—' },
    { label: 'FP16 (Dense)', value: chip.fp16_tflops ? `${chip.fp16_tflops} TFLOPS` : '—' },
    { label: 'FP32 (Dense)', value: chip.fp32_tflops ? `${chip.fp32_tflops} TFLOPS` : '—' },
    { label: 'Release Date', value: chip.release_date || '—' },
    { label: 'Price (USD)', value: chip.price_usd ? `$${chip.price_usd.toLocaleString()}` : '—' },
  ];

  return (
    <main className="min-h-screen bg-black text-white">
      <SiteHeader activeSection="cloud" secondaryLink={{ href: '/chips', label: 'Back to List' }} />

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* 头部 */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm font-bold text-emerald-400 tracking-wide uppercase">{chip.manufacturer}</span>
            <span className="text-xs text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800">{chip.category}</span>
          </div>
          <h1 className="text-5xl font-bold mb-4">{chip.name}</h1>
          <p className="text-slate-400 text-lg max-w-2xl">
            {chip.architecture 
              ? `Based on ${chip.architecture} architecture. ${chip.vram_gb}GB ${chip.vram_type || 'memory'} with ${chip.tdp_watt}W TDP.`
              : 'Detailed specifications and benchmark data for this AI accelerator.'
            }
          </p>
        </div>

        {/* 核心指标 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
            <div className="text-sm text-slate-500 mb-2">FP16 Performance</div>
            <div className="text-3xl font-bold text-white">{chip.fp16_tflops || '—'}</div>
            <div className="text-sm text-slate-400 mt-1">TFLOPS</div>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
            <div className="text-sm text-slate-500 mb-2">Memory Capacity</div>
            <div className="text-3xl font-bold text-white">{chip.vram_gb || '—'}</div>
            <div className="text-sm text-slate-400 mt-1">GB {chip.vram_type || ''}</div>
          </div>
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
            <div className="text-sm text-slate-500 mb-2">Power Draw</div>
            <div className="text-3xl font-bold text-white">{chip.tdp_watt || '—'}</div>
            <div className="text-sm text-slate-400 mt-1">Watts TDP</div>
          </div>
        </div>

        {/* 性价比 */}
        {perfPerDollar && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 mb-12">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-emerald-400 mb-1">Performance per Dollar</div>
                <div className="text-2xl font-bold text-emerald-300">{perfPerDollar} TFLOPS / $</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-500">Based on list price</div>
                <div className="text-xs text-slate-600">Subject to market fluctuation</div>
              </div>
            </div>
          </div>
        )}

        {/* Benchmark 数据 */}
        {benchmarks && benchmarks.length > 0 && (
          <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden mb-12">
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Benchmark Results</h2>
              <span className="text-xs text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800">{benchmarks.length} tests</span>
            </div>
            <div className="divide-y divide-slate-800">
              {benchmarks.map((b) => (
                <div key={b.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-900/30 transition">
                  <div>
                    <div className="text-slate-200 font-medium text-sm">{b.benchmark_name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{b.metric_name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-emerald-400 font-bold text-lg">
                      {Number(b.score).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 规格参数 */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden mb-12">
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50">
            <h2 className="text-lg font-semibold">Specifications</h2>
          </div>
          <div className="divide-y divide-slate-800">
            {specs.map((spec) => (
              <div key={spec.label} className="flex items-center justify-between px-6 py-4 hover:bg-slate-900/30 transition">
                <span className="text-slate-400 text-sm">{spec.label}</span>
                <span className="text-slate-200 font-medium">{spec.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 底部操作 */}
        <div className="flex items-center gap-4">
          <Link 
            href="/chips"
            className="px-6 py-3 bg-slate-900 border border-slate-700 text-white rounded-full hover:border-emerald-500 transition font-medium"
          >
            ← Back to Database
          </Link>
          <Link 
            href={`/chips?items=${encodeURIComponent(serializeCompareItems([{ id: chip.id, source: 'cloud' }]))}`}
            className="px-6 py-3 bg-emerald-500 text-black rounded-full hover:bg-emerald-400 transition font-bold"
          >
            Continue Comparing
          </Link>
        </div>
      </div>
    </main>
  );
}
