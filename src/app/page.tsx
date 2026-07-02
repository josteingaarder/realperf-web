export default function Home() {
  return (
    <main className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center px-4">
      <h1 className="text-5xl font-bold mb-4">RealPerf</h1>
      <p className="text-xl text-slate-400 mb-8">AI Chip Benchmark Database & Comparison Platform</p>
      <div className="flex gap-4">
        <button className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-500 transition">
          Explore Chips
        </button>
        <button className="px-6 py-3 border border-slate-600 rounded-lg hover:border-slate-400 transition">
          Compare Performance
        </button>
      </div>
      <div className="mt-16 grid grid-cols-3 gap-8 text-center">
        <div>
          <div className="text-3xl font-bold text-blue-400">50+</div>
          <div className="text-slate-500">AI Accelerators</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-blue-400">MLPerf</div>
          <div className="text-slate-500">Standard Benchmarks</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-blue-400">Real-time</div>
          <div className="text-slate-500">Price Tracking</div>
        </div>
      </div>
    </main>
  );
}