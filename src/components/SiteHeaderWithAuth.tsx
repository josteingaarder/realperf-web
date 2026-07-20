import SiteHeader, { type HeaderLink, type NavSection } from '@/components/SiteHeader';
import { getConsoleSession } from '@/lib/console-auth';

interface SiteHeaderWithAuthProps {
  activeSection?: NavSection;
  secondaryLink?: HeaderLink;
  cta?: HeaderLink;
}

export default async function SiteHeaderWithAuth({
  activeSection,
  secondaryLink,
  cta,
}: SiteHeaderWithAuthProps) {
  const session = await getConsoleSession();
  const canManageData =
    session?.profile.role === 'super_admin' || session?.profile.role === 'vendor_editor';

  return (
    <SiteHeader
      activeSection={activeSection}
      secondaryLink={secondaryLink ?? (!session ? { href: '/create-account', label: 'Create Account' } : undefined)}
      actionLink={!session ? { href: '/sign-in', label: 'Sign In' } : undefined}
      cta={canManageData ? { href: '/console', label: 'Manage Data' } : cta}
    />
  );
}
