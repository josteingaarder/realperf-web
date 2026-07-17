import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { fetchArchitectureCards } from '@/lib/architecture';

export const metadata: Metadata = {
  title: 'Architecture | RealPerf.ai',
  description:
    'Explore chip architecture coverage, including block diagrams, external interfaces, lane counts, memory connectivity, and platform capabilities.',
};

const architectureSections = [
  {
    title: 'Architecture Diagrams',
    description:
      'High-level block diagrams for compute clusters, memory hierarchy, interconnect topology, and accelerator packaging.',
  },
  {
    title: 'External Interfaces',
    description:
      'PCIe, NVLink, Ethernet, SerDes, MIPI, camera, display, and host I/O definitions with version and lane-level detail.',
  },
  {
    title: 'Interface Counts',
    description:
      'How many links, ports, memory channels, and accelerator-facing interfaces each chip exposes in real deployments.',
  },
  {
    title: 'Capability Notes',
    description:
      'Bandwidth ceilings, memory capacity envelope, media engines, virtualization support, and platform constraints.',
  },
];

const profileChecklist = [
  'Architecture diagram and subsystem overview',
  'Detailed external interface definitions and supported protocols',
  'Interface count, lane width, and bandwidth notes',
  'Memory connectivity, packaging, and expansion constraints',
  'Media, security, virtualization, and deployment capability notes',
];

export default async function ArchitecturePage() {
  const cards = await fetchArchitectureCards();
  const cloudCards = cards.filter((card) => card.source === 'cloud');
  const edgeCards = cards.filter((card) => card.source === 'edge');

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
              Architecture Coverage
            </div>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6">
              Understand how each chip is built and connected
            </h1>
            <p className="text-lg md:text-xl text-slate-400 leading-relaxed">
              This page is the entry point for architecture-first chip profiles. It is designed to bring together
              topology diagrams, external interface definitions, port counts, bandwidth classes, and other hardware
              capability details that do not fit inside a simple spec table.
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 pb-14">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {architectureSections.map((section) => (
            <div
              key={section.title}
              className="bg-slate-950/90 border border-slate-800 rounded-2xl p-6 hover:border-emerald-500/40 transition"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16M4 12h16" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2">{section.title}</h2>
              <p className="text-sm text-slate-400 leading-6">{section.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 pb-14">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-3">Architecture Cards</h2>
            <p className="text-slate-400 max-w-3xl">
              Each chip now has an architecture entry card. Open a card to view the new architecture detail skeleton,
              then extend it later with block diagrams, interface matrices, and vendor-specific capability notes.
            </p>
          </div>

          <div className="space-y-10">
            <div>
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <h3 className="text-2xl font-bold">Cloud Architecture</h3>
                  <p className="text-slate-500 mt-1">Server accelerators, expansion fabrics, and memory-topology oriented parts.</p>
                </div>
                <div className="text-sm text-slate-500">{cloudCards.length} cards</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {cloudCards.map((card) => (
                  <Link
                    key={`${card.source}:${card.id}`}
                    href={card.href}
                    className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/95 p-6 hover:border-emerald-500/40 hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.12),transparent_58%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative">
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <span className="text-xs uppercase tracking-[0.24em] text-emerald-400">Cloud</span>
                        <span className="text-xs text-slate-500">{card.manufacturer}</span>
                      </div>
                      <h4 className="text-2xl font-bold text-white mb-2">{card.name}</h4>
                      <p className="text-sm text-slate-400 mb-4">
                        {card.architecture
                          ? `${card.architecture} architecture profile`
                          : 'Architecture family detail is still being expanded.'}
                      </p>

                      <div className="grid grid-cols-2 gap-3 mb-5">
                        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                          <div className="text-xs text-slate-500 mb-1">Process</div>
                          <div className="text-sm font-medium text-white">{card.processNode ?? 'Pending'}</div>
                        </div>
                        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                          <div className="text-xs text-slate-500 mb-1">Compute</div>
                          <div className="text-sm font-medium text-white">{card.primaryMetric}</div>
                        </div>
                      </div>

                      <div className="text-sm text-slate-500 mb-5">Memory: <span className="text-slate-300">{card.memory}</span></div>
                      <div className="inline-flex items-center gap-2 text-sm font-medium text-emerald-400">
                        Open architecture detail
                        <svg className="w-4 h-4 group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <h3 className="text-2xl font-bold">Edge Architecture</h3>
                  <p className="text-slate-500 mt-1">Embedded AI SoCs, sensor-facing platforms, and low-power deployment targets.</p>
                </div>
                <div className="text-sm text-slate-500">{edgeCards.length} cards</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {edgeCards.map((card) => (
                  <Link
                    key={`${card.source}:${card.id}`}
                    href={card.href}
                    className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/95 p-6 hover:border-emerald-500/40 hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.12),transparent_58%)] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative">
                      <div className="flex items-center justify-between gap-3 mb-4">
                        <span className="text-xs uppercase tracking-[0.24em] text-emerald-400">Edge</span>
                        <span className="text-xs text-slate-500">{card.manufacturer}</span>
                      </div>
                      <h4 className="text-2xl font-bold text-white mb-2">{card.name}</h4>
                      <p className="text-sm text-slate-400 mb-4">
                        {card.architecture
                          ? `${card.architecture} architecture profile`
                          : 'Embedded architecture detail is queued for expansion.'}
                      </p>

                      <div className="grid grid-cols-2 gap-3 mb-5">
                        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                          <div className="text-xs text-slate-500 mb-1">Process</div>
                          <div className="text-sm font-medium text-white">{card.processNode ?? 'Pending'}</div>
                        </div>
                        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
                          <div className="text-xs text-slate-500 mb-1">Throughput</div>
                          <div className="text-sm font-medium text-white">{card.primaryMetric}</div>
                        </div>
                      </div>

                      <div className="text-sm text-slate-500 mb-5">Memory: <span className="text-slate-300">{card.memory}</span></div>
                      <div className="inline-flex items-center gap-2 text-sm font-medium text-emerald-400">
                        Open architecture detail
                        <svg className="w-4 h-4 group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-8">
            <h2 className="text-3xl font-bold mb-4">What each architecture profile will include</h2>
            <div className="space-y-4">
              {profileChecklist.map((item) => (
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
            <h2 className="text-3xl font-bold mb-4">Start from a chip family, then open the hardware detail</h2>
            <p className="text-slate-300 leading-7 mb-6">
              The long-term plan is to connect cloud and edge chip entries to architecture profiles, so users can move
              from summary specs into concrete hardware design, interface detail, and deployment constraints.
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
