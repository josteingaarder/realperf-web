import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* 导航栏 */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              RealPerf
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <Link href="/chips" className="hover:text-blue-600 transition">Chips</Link>
            <Link href="/chips" className="hover:text-blue-600 transition">Compare</Link>
            <Link href="/chips" className="hover:text-blue-600 transition">Benchmarks</Link>
            <a href="#" className="hover:text-blue-600 transition">Docs</a>
          </div>

          <div className="flex items-center gap-3">
            <button className="hidden md:block text-sm font-medium text-slate-600 hover:text-slate-900 transition">
              Sign in
            </button>
            <Link 
              href="/chips"
              className="text-sm font-medium px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition shadow-lg shadow-blue-500/25"
            >
              Explore Chips
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* 小标签 */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-full text-sm text-blue-700 mb-8">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            Introducing RealPerf — AI Chip Database & Benchmarks
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>

          {/* 大标题 */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            <span className="bg-gradient-to-r from-slate-900 via-blue-800 to-cyan-600 bg-clip-text text-transparent">
              Silicon built for real
            </span>
            <br />
            <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
              AI performance
            </span>
          </h1>

          {/* 副标题 */}
          <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            RealPerf aggregates benchmarks, specs, and real-world performance data for AI accelerators — 
            so you can compare H100, MI300X, Ascend, and more at a glance.
          </p>

          {/* CTA 按钮 */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Link 
              href="/chips"
              className="group flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition shadow-xl shadow-blue-500/20 font-medium"
            >
              Explore Chips
              <svg className="w-4 h-4 group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <button className="px-6 py-3 border border-slate-300 text-slate-700 rounded-full hover:border-slate-400 hover:bg-white transition font-medium bg-white/50">
              Read the benchmarks
            </button>
          </div>

          {/* 特性标签 */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              MLPerf & Standard Benchmarks
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Real-time Price Tracking
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-cyan-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              50+ AI Accelerators
            </div>
          </div>
        </div>
      </section>

      {/* 数据仪表盘预览 */}
      <section className="px-6 pb-20">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden">
            {/* 窗口标题栏 */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <span className="ml-3 text-sm text-slate-500 font-mono">realperf.ai / chip-comparison</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 text-xs rounded-full border border-green-200">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Live Data
              </div>
            </div>
            
            {/* 内容区 */}
            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100">
                <div className="text-sm text-slate-500 mb-2">FP16 Peak Performance</div>
                <div className="text-3xl font-bold text-slate-900">1,979 <span className="text-lg text-slate-400">TFLOPS</span></div>
                <div className="text-sm text-blue-600 mt-2 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  H100 SXM5
                </div>
              </div>
              
              <div className="p-6 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200">
                <div className="text-sm text-slate-500 mb-2">Memory Bandwidth</div>
                <div className="text-3xl font-bold text-slate-900">3.35 <span className="text-lg text-slate-400">TB/s</span></div>
                <div className="text-sm text-cyan-600 mt-2 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  H200
                </div>
              </div>
              
              <div className="p-6 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100">
                <div className="text-sm text-slate-500 mb-2">Chips in Database</div>
                <div className="text-3xl font-bold text-slate-900">10+</div>
                <div className="text-sm text-indigo-600 mt-2">NVIDIA, AMD, Intel, Huawei...</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 统计卡片 */}
      <section className="px-6 pb-20">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
          <div className="p-6">
            <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent mb-2">50+</div>
            <div className="text-sm text-slate-500 font-medium">AI Accelerators</div>
          </div>
          <div className="p-6">
            <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent mb-2">MLPerf</div>
            <div className="text-sm text-slate-500 font-medium">Standard Benchmarks</div>
          </div>
          <div className="p-6">
            <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent mb-2">Real-time</div>
            <div className="text-sm text-slate-500 font-medium">Price Tracking</div>
          </div>
        </div>
      </section>
    </main>
  );
}