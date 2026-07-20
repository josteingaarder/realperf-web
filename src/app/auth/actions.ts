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

export async function publicSignInAction(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    redirect('/sign-in?error=Email and password are required.');
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/sign-in?error=${encodeURIComponent(getSafeMessage(error))}`);
  }

  const userId = data.user?.id;

  if (!userId) {
    redirect('/sign-in?error=Unable to resolve the account after sign in.');
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (profileError) {
    redirect(`/sign-in?error=${encodeURIComponent(profileError.message)}`);
  }

  if (profile?.role === 'super_admin' || profile?.role === 'vendor_editor') {
    redirect('/console');
  }

  redirect('/collections');
}

export async function publicSignUpAction(formData: FormData) {
  const displayName = String(formData.get('display_name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const confirmPassword = String(formData.get('confirm_password') ?? '');

  if (!displayName || !email || !password || !confirmPassword) {
    redirect('/create-account?error=Display name, email, and password are required.');
  }

  if (password.length < 8) {
    redirect('/create-account?error=Password must be at least 8 characters.');
  }

  if (password !== confirmPassword) {
    redirect('/create-account?error=Passwords do not match.');
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
      },
      emailRedirectTo: getAppUrl('/auth/callback?next=/sign-in&type=public-signup'),
    },
  });

  if (error) {
    redirect(`/create-account?error=${encodeURIComponent(getSafeMessage(error))}`);
  }

  if (data.session) {
    await supabase.auth.signOut();
  }

  redirect(
    '/sign-in?message=' +
      encodeURIComponent('Account created. Check your email to verify the address, then sign in.')
  );
}
