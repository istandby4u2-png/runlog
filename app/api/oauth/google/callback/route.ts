import { NextRequest, NextResponse } from 'next/server';
import {
  exchangeCodeForTokens,
  isGoogleRefreshTokenInvalidError,
} from '@/lib/google-photos-api';
import { userTokens } from '@/lib/db-supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(
      new URL(`/settings?error=google_${error}`, request.url)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/settings?error=google_missing_params', request.url)
    );
  }

  const userId = parseInt(state, 10);
  if (isNaN(userId)) {
    return NextResponse.redirect(
      new URL('/settings?error=google_invalid_state', request.url)
    );
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const existing = await userTokens.findByProvider(userId, 'google_photos');

    await userTokens.upsert({
      user_id: userId,
      provider: 'google_photos',
      access_token: tokens.access_token,
      // 재연결 시 Google이 refresh_token을 생략하는 경우가 많음 — 기존 값 유지
      refresh_token: tokens.refresh_token ?? existing?.refresh_token ?? null,
      token_expires_at: new Date(
        Date.now() + tokens.expires_in * 1000
      ).toISOString(),
    });

    return NextResponse.redirect(
      new URL('/settings?success=google_photos', request.url)
    );
  } catch (err: unknown) {
    if (isGoogleRefreshTokenInvalidError(err)) {
      return NextResponse.redirect(
        new URL('/settings?error=google_reconnect', request.url)
      );
    }
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Google OAuth callback error:', msg);
    return NextResponse.redirect(
      new URL(`/settings?error=${encodeURIComponent(msg)}`, request.url)
    );
  }
}
