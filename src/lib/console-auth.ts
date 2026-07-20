import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export type AppRole = 'super_admin' | 'vendor_editor' | 'user';

export interface ManufacturerMembership {
  manufacturer_id: string;
  role: 'owner' | 'editor' | 'reviewer';
}

export interface ConsoleSession {
  user: {
    id: string;
    email: string | null;
  };
  profile: {
    display_name: string | null;
    role: AppRole;
  };
  memberships: ManufacturerMembership[];
}

export function hasConsoleAccess(session: ConsoleSession) {
  if (session.profile.role === 'super_admin') {
    return true;
  }

  return session.profile.role === 'vendor_editor' && session.memberships.length > 0;
}

export const getConsoleSession = cache(async (): Promise<ConsoleSession | null> => {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [{ data: profile }, { data: memberships }] = await Promise.all([
    supabase.from('profiles').select('display_name,role').eq('id', user.id).maybeSingle(),
    supabase.from('manufacturer_memberships').select('manufacturer_id,role').eq('user_id', user.id),
  ]);

  return {
    user: {
      id: user.id,
      email: user.email ?? null,
    },
    profile: {
      display_name: profile?.display_name ?? null,
      role: (profile?.role as AppRole | undefined) ?? 'user',
    },
    memberships: (memberships ?? []) as ManufacturerMembership[],
  };
});

export async function requireConsoleSession() {
  const session = await getConsoleSession();

  if (!session) {
    redirect('/console/login');
  }

  if (!hasConsoleAccess(session)) {
    redirect('/console/login?error=Console access has not been granted for this account.');
  }

  return session;
}

export function canManageManufacturer(session: ConsoleSession, manufacturerId: string | null | undefined) {
  if (!manufacturerId) {
    return false;
  }

  if (session.profile.role === 'super_admin') {
    return true;
  }

  return session.memberships.some(
    (membership) =>
      membership.manufacturer_id === manufacturerId &&
      (membership.role === 'owner' || membership.role === 'editor')
  );
}
