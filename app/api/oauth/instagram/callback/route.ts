import { NextRequest, NextResponse } from 'next/server';
import {
  exchangeCodeForToken,
  getLongLivedToken,
} from '@/lib/instagram-api';
import { userTokens } from '@/lib/db-supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(
      new URL(`/settings?error=instagram_${error}`, request.url)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/settings?error=instagram_missing_params', request.url)
    );
  }

  const userId = parseInt(state, 10);
  if (isNaN(userId)) {
    return NextResponse.redirect(
      new URL('/settings?error=instagram_invalid_state', request.url)
    );
  }

  try {
    const shortLived = await exchangeCodeForToken(code);
    const longLived = await getLongLivedToken(shortLived.access_token);

    await userTokens.upsert({
      user_id: userId,
      provider: 'instagram',
      access_token: longLived.access_token,
      refresh_token: null,
      token_expires_at: new Date(
        Date.now() + longLived.expires_in * 1000
      ).toISOString(),
      extra_data: { ig_user_id: shortLived.user_id },
    });

    return NextResponse.redirect(
      new URL('/settings?success=instagram', request.url)
    );
  } catch (err: unknown) {
    console.error('Instagram OAuth callback error:', err);
    return NextResponse.redirect(
      new URL('/settings?error=instagram_token_exchange', request.url)
    );
  }
}
