import Link from 'next/link';
import SiteHeaderWithAuth from '@/components/SiteHeaderWithAuth';
import type { ArchitectureSource } from '@/lib/architecture';
import { fetchArchitectureProfile } from '@/lib/architecture';

function getBackLink(source: ArchitectureSource) {
  return source === 'cloud' ? '/chips' : '/edge';
}

function getBackLabel(source: ArchitectureSource) {
  return source === 'cloud' ? 'Back to Cloud Database' : 'Back to Edge Database';
}

export default async function ArchitectureDetailPage({
  source,
  id,
}: {
  source: ArchitectureSource;
  id: string;
}) {
  const profile = await fetchArchitectureProfile(source, id);

  if (!profile) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center px-6">
          <h1 className="text-2xl font-bold mb-4">Architecture profile not found</h1>
          <Link href="/architecture" className="text-emerald-400 hover:underline">
            Back to architecture index
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <SiteHeaderWithAuth
        activeSection={source}
        secondaryLink={{ href: '/architecture', label: 'Back to Architecture' }}
        cta={{ href: '/collections', label: 'My Collections' }}
      />

      <section className="px-6 pt-20 pb-12">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <span className="text-sm font-bold text-emerald-400 tracking-wide uppercase">{profile.manufacturer}</span>
            <span className="text-xs text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800">
              {profile.source === 'cloud' ? 'Cloud Architecture' : 'Edge Architecture'}
            </span>
            <span className="text-xs text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800">
              {profile.category}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 items-start">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-5">{profile.name}</h1>
              <p className="text-lg text-slate-400 leading-relaxed max-w-3xl mb-8">{profile.description}</p>

              <div className="flex flex-wrap gap-4">
                <Link
                  href={getBackLink(profile.source)}
                  className="px-6 py-3 border border-slate-700 text-white rounded-full hover:border-emerald-500 transition font-medium"
                >
                  {getBackLabel(profile.source)}
                </Link>
                <Link
                  href={profile.source === 'cloud' ? `/chips/${profile.id}` : `/edge/${profile.id}`}
                  className="px-6 py-3 bg-emerald-500 text-black rounded-full hover:bg-emerald-400 transition font-semibold"
                >
                  View Product Detail
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-8">
              <div className="text-sm uppercase tracking-[0.24em] text-emerald-400 mb-4">Architecture Snapshot</div>
              <div className="text-sm text-slate-500 mb-2">{profile.heroMetricLabel}</div>
              <div className="text-4xl font-bold text-white mb-6">{profile.heroMetricValue}</div>
              <div className="space-y-4">
                {profile.sections.slice(0, 3).map((section) => (
                  <div
                    key={section.title}
                    className="flex items-center justify-between border-b border-slate-800 pb-4 last:border-b-0 last:pb-0"
                  >
                    <span className="text-slate-400">{section.title}</span>
                    <span className="text-white font-medium text-right max-w-[14rem]">{section.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
          {profile.topologyHighlights.map((item) => (
            <div key={item} className="rounded-2xl border border-slate-800 bg-slate-950 p-6">
              <div className="text-sm font-medium text-emerald-400 mb-2">Topology Note</div>
              <p className="text-sm text-slate-300 leading-6">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 pb-10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-8">
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-8">
            <div className="text-sm uppercase tracking-[0.24em] text-emerald-400 mb-4">Architecture Schema</div>
            <h2 className="text-3xl font-bold mb-5">Profile structure and currently mapped fields</h2>
            <div className="space-y-4">
              {profile.sections.map((section) => (
                <div key={section.title} className="flex items-start justify-between gap-6 border-b border-slate-800 pb-4 last:border-b-0 last:pb-0">
                  <span className="text-slate-400">{section.title}</span>
                  <span className="text-slate-200 font-medium text-right max-w-[18rem]">{section.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-8">
            <div className="text-sm uppercase tracking-[0.24em] text-emerald-400 mb-4">Pending Dataset</div>
            <h2 className="text-3xl font-bold mb-5">Fields to populate next</h2>
            <div className="space-y-4">
              {profile.pendingFields.map((field) => (
                <div key={field} className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
                  </svg>
                  <p className="text-slate-300">{field}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <div className="text-sm uppercase tracking-[0.24em] text-emerald-400 mb-3">External Interfaces</div>
            <h2 className="text-3xl font-bold">Interface definition matrix</h2>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {profile.interfaceGroups.map((group) => (
              <div key={group.title} className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-800 bg-slate-900/50">
                  <h3 className="text-xl font-semibold mb-2">{group.title}</h3>
                  <p className="text-sm text-slate-400">{group.description}</p>
                </div>
                <div className="divide-y divide-slate-800">
                  {group.items.map((item) => (
                    <div key={item.name} className="p-6">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <h4 className="text-lg font-medium text-white">{item.name}</h4>
                        <span className="text-xs text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                          {item.count}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 leading-6 mb-3">{item.definition}</p>
                      <div className="text-sm text-emerald-400">{item.capability}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
