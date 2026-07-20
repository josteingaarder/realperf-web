import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/console';
  const type = requestUrl.searchParams.get('type');
  const redirectUrl = new URL(next, requestUrl.origin);

  if (!code) {
    redirectUrl.searchParams.set('error', 'Authentication code was missing.');
    return NextResponse.redirect(redirectUrl);
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    redirectUrl.searchParams.set('error', error.message);
    return NextResponse.redirect(redirectUrl);
  }

  if (type === 'signup') {
    redirectUrl.pathname = '/console/login';
    redirectUrl.searchParams.set('message', 'Email verified. Sign in after your console access is approved.');
  }

  if (type === 'public-signup') {
    redirectUrl.pathname = '/sign-in';
    redirectUrl.searchParams.set('message', 'Email verified. You can now sign in.');
  }

  if (type === 'recovery') {
    redirectUrl.pathname = '/console/reset-password';
    redirectUrl.searchParams.delete('message');
    redirectUrl.searchParams.delete('error');
  }

  return NextResponse.redirect(redirectUrl);
}
