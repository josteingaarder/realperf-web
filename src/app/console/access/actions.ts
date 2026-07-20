'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import type { AppRole, ConsoleSession, ManufacturerMembership } from '@/lib/console-auth';
import { getConsoleSession } from '@/lib/console-auth';

const APP_ROLES: AppRole[] = ['super_admin', 'vendor_editor', 'user'];
const MEMBERSHIP_ROLES: ManufacturerMembership['role'][] = ['owner', 'editor', 'reviewer'];

function assertRole(value: string): AppRole {
  if (APP_ROLES.includes(value as AppRole)) {
    return value as AppRole;
  }

  throw new Error('Invalid application role.');
}

function assertMembershipRole(value: string): ManufacturerMembership['role'] {
  if (MEMBERSHIP_ROLES.includes(value as ManufacturerMembership['role'])) {
    return value as ManufacturerMembership['role'];
  }

  throw new Error('Invalid membership role.');
}

async function requireSuperAdminSession(): Promise<ConsoleSession> {
  const session = await getConsoleSession();

  if (!session || session.profile.role !== 'super_admin') {
    throw new Error('Only super admins can manage console access.');
  }

  return session;
}

function getSafeMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Something went wrong.';
}

export async function updateProfileRoleAction(formData: FormData) {
  try {
    await requireSuperAdminSession();

    const userId = String(formData.get('user_id') ?? '').trim();
    const nextRole = assertRole(String(formData.get('role') ?? '').trim());

    if (!userId) {
      throw new Error('User is required.');
    }

    const supabase = await createServerSupabaseClient();
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) {
      throw new Error(profileError.message);
    }

    if (!profile) {
      throw new Error('User profile not found.');
    }

    if (profile.role === 'super_admin' && nextRole !== 'super_admin') {
      const { count, error: countError } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'super_admin');

      if (countError) {
        throw new Error(countError.message);
      }

      if ((count ?? 0) <= 1) {
        throw new Error('At least one super admin must remain assigned.');
      }
    }

    const { error } = await supabase.from('profiles').update({ role: nextRole }).eq('id', userId);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath('/console/access');
    redirect('/console/access?message=Profile role updated.');
  } catch (error) {
    redirect(`/console/access?error=${encodeURIComponent(getSafeMessage(error))}`);
  }
}

export async function saveManufacturerMembershipAction(formData: FormData) {
  try {
    await requireSuperAdminSession();

    const userId = String(formData.get('user_id') ?? '').trim();
    const manufacturerId = String(formData.get('manufacturer_id') ?? '').trim();
    const role = assertMembershipRole(String(formData.get('membership_role') ?? '').trim());

    if (!userId || !manufacturerId) {
      throw new Error('User and manufacturer are required.');
    }

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from('manufacturer_memberships').upsert(
      {
        user_id: userId,
        manufacturer_id: manufacturerId,
        role,
      },
      { onConflict: 'manufacturer_id,user_id' }
    );

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath('/console/access');
    redirect('/console/access?message=Manufacturer membership saved.');
  } catch (error) {
    redirect(`/console/access?error=${encodeURIComponent(getSafeMessage(error))}`);
  }
}

export async function removeManufacturerMembershipAction(formData: FormData) {
  try {
    await requireSuperAdminSession();

    const membershipId = String(formData.get('membership_id') ?? '').trim();

    if (!membershipId) {
      throw new Error('Membership is required.');
    }

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.from('manufacturer_memberships').delete().eq('id', membershipId);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath('/console/access');
    redirect('/console/access?message=Manufacturer membership removed.');
  } catch (error) {
    redirect(`/console/access?error=${encodeURIComponent(getSafeMessage(error))}`);
  }
}

export async function createConsoleInviteAction(formData: FormData) {
  try {
    const session = await requireSuperAdminSession();
    const email = String(formData.get('email') ?? '').trim().toLowerCase();
    const appRole = assertRole(String(formData.get('app_role') ?? '').trim());
    const manufacturerId = String(formData.get('manufacturer_id') ?? '').trim();
    const membershipRoleRaw = String(formData.get('membership_role') ?? '').trim();
    const expiresInDays = Number(String(formData.get('expires_in_days') ?? '7').trim() || '7');
    const notes = String(formData.get('notes') ?? '').trim();

    if (!email) {
      throw new Error('Invite email is required.');
    }

    if (appRole === 'vendor_editor' && (!manufacturerId || !membershipRoleRaw)) {
      throw new Error('Vendor editor invites require a manufacturer and membership role.');
    }

    if ((appRole === 'super_admin' || appRole === 'user') && (manufacturerId || membershipRoleRaw)) {
      throw new Error('Only vendor editor invites can include manufacturer scope.');
    }

    const supabase = await createServerSupabaseClient();
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + Math.max(1, expiresInDays) * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase.from('console_access_invites').insert({
      email,
      token,
      app_role: appRole,
      manufacturer_id: manufacturerId || null,
      membership_role: membershipRoleRaw ? assertMembershipRole(membershipRoleRaw) : null,
      expires_at: expiresAt,
      invited_by: session.user.id,
      notes: notes || null,
    });

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath('/console/access');
    redirect(
      `/console/access?message=${encodeURIComponent('Invitation created.')}&inviteToken=${encodeURIComponent(token)}`
    );
  } catch (error) {
    redirect(`/console/access?error=${encodeURIComponent(getSafeMessage(error))}`);
  }
}

export async function revokeConsoleInviteAction(formData: FormData) {
  try {
    await requireSuperAdminSession();
    const inviteId = String(formData.get('invite_id') ?? '').trim();

    if (!inviteId) {
      throw new Error('Invite is required.');
    }

    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from('console_access_invites')
      .update({
        status: 'revoked',
      })
      .eq('id', inviteId)
      .eq('status', 'pending');

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath('/console/access');
    redirect('/console/access?message=Invitation revoked.');
  } catch (error) {
    redirect(`/console/access?error=${encodeURIComponent(getSafeMessage(error))}`);
  }
}
