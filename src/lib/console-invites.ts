import { getAppUrl } from '@/lib/app-url';

export function buildInviteUrl(token: string) {
  return getAppUrl(`/console/login?invite=${encodeURIComponent(token)}`);
}
