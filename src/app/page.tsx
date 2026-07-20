import Link from 'next/link';
import type { Metadata } from 'next';
import StatsCards from './StatsCards';
import SiteHeader from '@/components/SiteHeader';

export const metadata: Metadata = {
  title: 'RealPerf.ai - AI Chip Benchmark Database & Comparison',
  description: 'Compare AI accelerators including H100, MI300X, Ascend, TPU and more. Real-time benchmarks, specs, and price tracking.',
  keywords: ['AI chip', 'GPU benchmark', 'H100', 'MI300X', 'NVIDIA', 'AMD', 'MLPerf'],
  openGraph: {
    title: 'RealPerf.ai - AI Chip Database',
    description: 'Compare AI accelerators with real benchmark data',
    type: 'website',
    url: 'https://www.realperf.ai',
  },
};

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white relative overflow-hidden">
      <div className="hero-spotlight pointer-events-none absolute inset-x-0 top-0 h-[720px]" />

      {/* 双层荧光绿科技光晕 */}
      <div className="absolute top-[-80px] left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-emerald-500/20 rounded-full blur-[140px] pointer-events-none animate-drift" />
      <div className="absolute top-[40px] left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-emerald-400/35 rounded-full blur-[60px] pointer-events-none animate-float-slow" />
      <div className="absolute top-52 left-[10%] w-32 h-32 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none animate-float-slower" />
      <div className="absolute top-80 right-[12%] w-40 h-40 bg-emerald-300/10 rounded-full blur-3xl pointer-events-none animate-drift-reverse" />

      <SiteHeader
        secondaryLink={{ href: '/console/login', label: 'Sign In' }}
        actionLink={{ href: '/console/login#request-access', label: 'Create Account' }}
        cta={{ href: '/collections', label: 'My Collections' }}
      />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-fade-up inline-flex items-center gap-2 px-4 py-2 bg-slate-900/80 border border-slate-800 rounded-full text-sm text-emerald-400 mb-8 shadow-[0_0_40px_rgba(16,185,129,0.08)]">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            Live AI Chip Database & Benchmarks
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>

          <h1 className="animate-fade-up animate-delay-1 text-5xl md:text-7xl font-bold tracking-tight mb-6">
            <span className="text-white">Silicon built for real</span>
            <br />
            <span className="text-emerald-400">AI performance</span>
          </h1>

          <p className="animate-fade-up animate-delay-2 text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            RealPerf aggregates benchmarks, specs, and real-world performance data for AI accelerators — 
            so you can compare H100, MI300X, Ascend, and more at a glance.
          </p>

          <div className="animate-fade-up animate-delay-3 flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <Link 
              href="/chip-of-the-day"
              className="group flex items-center gap-2 px-6 py-3 bg-emerald-500 text-black rounded-full hover:bg-emerald-400 hover:shadow-[0_0_30px_rgba(52,211,153,0.35)] transition-all duration-300 font-semibold"
            >
              Chip of the Day
              <svg className="w-4 h-4 group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>

            <Link
              href="/console/login#request-access"
              className="group flex items-center gap-2 rounded-full border border-slate-700 px-6 py-3 text-white transition-all duration-300 hover:border-emerald-500 hover:text-emerald-300"
            >
              Create Account
              <svg className="w-4 h-4 group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h4m0 0v4m0-4L9 15" />
              </svg>
            </Link>
          </div>

          <div className="animate-fade-up animate-delay-3 mb-12 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-slate-400">
            <span>Have an account?</span>
            <Link href="/console/login" className="font-medium text-white transition hover:text-emerald-300">
              Sign in to Console
            </Link>
            <span className="hidden sm:inline text-slate-600">|</span>
            <span>New here?</span>
            <Link href="/console/login#request-access" className="font-medium text-emerald-400 transition hover:text-emerald-300">
              Create one now
            </Link>
          </div>

          <div className="animate-fade-up animate-delay-4 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              MLPerf & Standard Benchmarks
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Side-by-Side Comparison
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Real-time Data
            </div>
          </div>
        </div>
      </section>

      {/* 核心功能入口 */}
      <section className="px-6 pb-12">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/chips" className="group relative overflow-hidden bg-slate-950/90 border border-slate-800 rounded-xl p-8 hover:border-emerald-500/50 hover:-translate-y-1 hover:shadow-[0_18px_60px_rgba(16,185,129,0.12)] transition-all duration-300 animate-fade-up animate-delay-1">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.16),transparent_55%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </div>
              <h3 className="relative text-lg font-bold text-white mb-2">Chip Database</h3>
              <p className="relative text-sm text-slate-400">Browse AI accelerators from NVIDIA, AMD, Intel, Huawei, and more. Filter by specs and price.</p>
            </Link>

            <Link href="/architecture" className="group relative overflow-hidden bg-slate-950/90 border border-slate-800 rounded-xl p-8 hover:border-emerald-500/50 hover:-translate-y-1 hover:shadow-[0_18px_60px_rgba(16,185,129,0.12)] transition-all duration-300 animate-fade-up animate-delay-2">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.16),transparent_55%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="7" y="7" width="10" height="10" rx="1.5" strokeWidth={2} />
                  <rect x="10" y="10" width="4" height="4" rx="0.6" strokeWidth={2} />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
                </svg>
              </div>
              <h3 className="relative text-lg font-bold text-white mb-2">Architecture</h3>
              <p className="relative text-sm text-slate-400">Explore chip architecture diagrams, interface definitions, I/O counts, bandwidth, and hardware capability details across accelerator families.</p>
            </Link>

            <Link href="/tool-chain" className="group relative overflow-hidden bg-slate-950/90 border border-slate-800 rounded-xl p-8 hover:border-emerald-500/50 hover:-translate-y-1 hover:shadow-[0_18px_60px_rgba(16,185,129,0.12)] transition-all duration-300 animate-fade-up animate-delay-3">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.16),transparent_55%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-emerald-500/20 transition">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="relative text-lg font-bold text-white mb-2">Tool Chain</h3>
              <p className="relative text-sm text-slate-400">Explore the software stack behind each chip, including frameworks, compilers, runtimes, and deployment tooling for real-world AI workflows.</p>
            </Link>
          </div>
        </div>
      </section>

      {/* 数据仪表盘 - 动态真实数据 */}
      <section className="px-6 pt-2 pb-20 md:pt-4">
        <div className="max-w-5xl mx-auto">
          <div className="relative overflow-hidden bg-slate-950 rounded-2xl border border-slate-800 shadow-2xl shadow-emerald-500/5">
            <div className="scanline pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/80 to-transparent" />
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="ml-3 text-sm text-slate-500 font-mono">Model Performance Benchmark</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs rounded-full border border-emerald-500/20">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                Live Data
              </div>
            </div>
            
            <StatsCards />
          </div>
        </div>
      </section>

      {/* 底部 CTA */}
      <section className="px-6 pb-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to find the right chip?</h2>
          <p className="text-slate-400 mb-8">Compare AI accelerators side by side and make data-driven decisions.</p>
          <Link 
            href="/chips"
            className="inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 text-black rounded-full hover:bg-emerald-400 transition font-bold text-lg"
          >
            Explore the Database
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>
    </main>
  );
}
