import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';

export const metadata: Metadata = {
  title: 'Tool Chain | RealPerf.ai',
  description:
    'Explore frameworks, compilers, runtimes, and deployment tooling across AI chips and accelerator ecosystems.',
};

const layers = [
  {
    title: 'Framework Layer',
    description:
      'PyTorch, TensorFlow, ONNX, and vendor SDK integrations that define how developers start model development.',
  },
  {
    title: 'Compiler Layer',
    description:
      'TensorRT, TVM, XLA, ROCm compilers, and graph optimization stacks that turn models into hardware-aware artifacts.',
  },
  {
    title: 'Runtime Layer',
    description:
      'Inference servers, execution engines, kernels, and driver dependencies that determine real deployment behavior.',
  },
  {
    title: 'Deployment Layer',
    description:
      'Containers, orchestration, edge packaging, observability, and CI/CD workflows needed to run AI systems in production.',
  },
];

const ecosystems = [
  {
    name: 'NVIDIA CUDA Stack',
    summary: 'CUDA, cuDNN, TensorRT, Triton, and inference deployment guidance for cloud-scale GPUs.',
    chips: 'H100, H200, L40S, Jetson family',
  },
  {
    name: 'AMD ROCm Stack',
    summary: 'ROCm libraries, compiler compatibility, and model serving notes for Instinct accelerators.',
    chips: 'MI300X, MI250, future ROCm-supported parts',
  },
  {
    name: 'Huawei CANN Stack',
    summary: 'Ascend toolchains, operator adaptation, and deployment constraints for enterprise AI workloads.',
    chips: 'Ascend 910B and related accelerator families',
  },
  {
    name: 'Intel oneAPI Stack',
    summary: 'oneAPI, OpenVINO, and heterogeneous runtime paths across accelerator and CPU-assisted inference.',
    chips: 'Gaudi, Intel GPU, hybrid inference platforms',
  },
];

const profileSections = [
  'Supported frameworks and model formats',
  'Compiler / optimization flow and export path',
  'Runtime dependencies, serving options, and known caveats',
  'Deployment patterns for cloud, edge, and private environments',
];

export default function ToolChainPage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <SiteHeader
        cta={{ href: '/collections', label: 'My Collections' }}
        secondaryLink={{ href: '/', label: 'Back to Home' }}
      />

      <section className="px-6 pt-24 pb-16">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 bg-slate-900/80 border border-slate-800 rounded-full text-sm text-emerald-400">
              <span className="w-2 h-2 bg-emerald-500 rounded-full" />
              Tool Chain Coverage
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
              Understand the software stack behind each AI chip
            </h1>
            <p className="text-lg md:text-xl text-slate-400 leading-relaxed">
              This page is the entry point for detailed chip-by-chip tool chain profiles. It is designed to show how
              frameworks, compilers, runtimes, and deployment tooling differ across accelerator ecosystems.
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 pb-14">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {layers.map((layer) => (
            <div
              key={layer.title}
              className="bg-slate-950/90 border border-slate-800 rounded-2xl p-6 hover:border-emerald-500/40 transition"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2">{layer.title}</h2>
              <p className="text-sm text-slate-400 leading-6">{layer.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 pb-14">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-3">Ecosystems We Plan to Expand</h2>
            <p className="text-slate-400 max-w-3xl">
              Each ecosystem profile will eventually break down supported model paths, optimization flow, deployment
              constraints, and real-world engineering tradeoffs for the chips in that family.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ecosystems.map((ecosystem) => (
              <div
                key={ecosystem.name}
                className="relative overflow-hidden bg-slate-950 border border-slate-800 rounded-2xl p-8"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.12),transparent_55%)]" />
                <div className="relative">
                  <div className="text-xs uppercase tracking-[0.24em] text-emerald-400 mb-3">Coverage Roadmap</div>
                  <h3 className="text-2xl font-bold mb-3">{ecosystem.name}</h3>
                  <p className="text-slate-400 leading-7 mb-4">{ecosystem.summary}</p>
                  <div className="text-sm text-slate-500">
                    Target chips: <span className="text-slate-300">{ecosystem.chips}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8">
            <h2 className="text-3xl font-bold mb-4">What each chip profile will include</h2>
            <div className="space-y-4">
              {profileSections.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-slate-300">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-8">
            <div className="text-sm uppercase tracking-[0.24em] text-emerald-400 mb-4">Planned Entry Flow</div>
            <h2 className="text-3xl font-bold mb-4">Start from chips, then drill into the stack</h2>
            <p className="text-slate-300 leading-7 mb-6">
              The long-term plan is to connect chip entries to dedicated tool chain pages, so users can move from
              hardware comparison into practical software readiness and deployment detail.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/chips"
                className="px-6 py-3 bg-emerald-500 text-black rounded-full hover:bg-emerald-400 transition font-semibold"
              >
                Browse Cloud Chips
              </Link>
              <Link
                href="/edge"
                className="px-6 py-3 border border-slate-700 text-white rounded-full hover:border-emerald-500 transition font-medium"
              >
                Browse Edge Chips
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
