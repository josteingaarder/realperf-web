'use server';

import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { getAppUrl } from '@/lib/app-url';

function getSafeMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Something went wrong.';
}

export async function signInAction(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    redirect('/console/login?error=Email and password are required.');
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/console/login?error=${encodeURIComponent(getSafeMessage(error))}`);
  }

  redirect('/console');
}

export async function signUpAction(formData: FormData) {
  const displayName = String(formData.get('display_name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const confirmPassword = String(formData.get('confirm_password') ?? '');
  const inviteToken = String(formData.get('invite_token') ?? '').trim();

  if (!displayName || !email || !password || !confirmPassword) {
    redirect('/console/login?error=Display name, email, and password are required.');
  }

  if (password.length < 8) {
    redirect('/console/login?error=Password must be at least 8 characters.');
  }

  if (password !== confirmPassword) {
    redirect('/console/login?error=Passwords do not match.');
  }

  const supabase = await createServerSupabaseClient();

  if (inviteToken) {
    const { data: invite, error: inviteError } = await supabase
      .from('console_access_invites')
      .select('email,status,expires_at')
      .eq('token', inviteToken)
      .maybeSingle();

    if (inviteError) {
      redirect(`/console/login?error=${encodeURIComponent(getSafeMessage(inviteError))}&invite=${encodeURIComponent(inviteToken)}`);
    }

    if (!invite || invite.status !== 'pending' || new Date(invite.expires_at).getTime() <= Date.now()) {
      redirect(`/console/login?error=${encodeURIComponent('This invitation is invalid or expired.')}`);
    }

    if (invite.email.toLowerCase() !== email.toLowerCase()) {
      redirect(
        `/console/login?error=${encodeURIComponent('The email must match the invitation recipient.')}&invite=${encodeURIComponent(inviteToken)}`
      );
    }
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
      },
      emailRedirectTo: getAppUrl('/auth/callback?next=/console/login&type=signup'),
    },
  });

  if (error) {
    redirect(`/console/login?error=${encodeURIComponent(getSafeMessage(error))}`);
  }

  if (data.session) {
    await supabase.auth.signOut();
  }

  redirect(
    '/console/login?message=' +
      encodeURIComponent(
        inviteToken
          ? 'Invitation accepted. Check your email to verify the account, then sign in.'
          : 'Account created. Check your email to verify the address, then ask a super admin to grant console access.'
      )
  );
}

export async function resendVerificationEmailAction(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();

  if (!email) {
    redirect('/console/login?error=Email is required to resend verification.');
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: getAppUrl('/auth/callback?next=/console/login&type=signup'),
    },
  });

  if (error) {
    redirect(`/console/login?error=${encodeURIComponent(getSafeMessage(error))}`);
  }

  redirect('/console/login?message=' + encodeURIComponent('Verification email sent. Please check your inbox.'));
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();

  if (!email) {
    redirect('/console/login?error=Email is required to send a password reset link.');
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getAppUrl('/auth/callback?next=/console/reset-password&type=recovery'),
  });

  if (error) {
    redirect(`/console/login?error=${encodeURIComponent(getSafeMessage(error))}`);
  }

  redirect('/console/login?message=' + encodeURIComponent('Password reset link sent. Please check your inbox.'));
}

export async function signOutAction() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect('/console/login?message=Signed out successfully.');
}
