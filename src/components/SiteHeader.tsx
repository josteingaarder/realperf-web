import Link from 'next/link';

type NavSection = 'cloud' | 'edge' | 'collections';

interface HeaderLink {
  href: string;
  label: string;
}

interface SiteHeaderProps {
  activeSection?: NavSection;
  cta?: HeaderLink;
  secondaryLink?: HeaderLink;
}

const navItems: Array<{ href: string; label: string; section: NavSection }> = [
  { href: '/chips', label: 'Cloud', section: 'cloud' },
  { href: '/edge', label: 'Edge', section: 'edge' },
];

function getNavClasses(isActive: boolean) {
  return isActive
    ? 'text-emerald-400 font-semibold'
    : 'text-white hover:text-emerald-400 transition text-base font-medium';
}

export default function SiteHeader({
  activeSection,
  cta,
  secondaryLink,
}: SiteHeaderProps) {
  return (
    <nav className="sticky top-0 z-50 bg-black/50 backdrop-blur-xl border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-white tracking-tight">
            RealPerf<span className="text-emerald-400">.ai</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
          {navItems.map((item) => (
            <Link
              key={item.section}
              href={item.href}
              className={getNavClasses(activeSection === item.section)}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {secondaryLink ? (
            <Link
              href={secondaryLink.href}
              className="hidden md:block text-sm font-medium text-slate-400 hover:text-white transition"
            >
              {secondaryLink.label}
            </Link>
          ) : null}

          {cta ? (
            <Link
              href={cta.href}
              className="text-sm font-medium px-4 py-2 bg-emerald-500 text-black rounded-full hover:bg-emerald-400 transition font-semibold"
            >
              {cta.label}
            </Link>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
