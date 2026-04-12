import { NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForTokens } from '@/lib/strava-api';
import { userTokens } from '@/lib/db-supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(
      new URL(`/settings?error=strava_${error}`, request.url)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/settings?error=strava_missing_params', request.url)
    );
  }

  const userId = parseInt(state, 10);
  if (isNaN(userId)) {
    return NextResponse.redirect(
      new URL('/settings?error=strava_invalid_state', request.url)
    );
  }

  try {
    const tokens = await exchangeCodeForTokens(code);

    await userTokens.upsert({
      user_id: userId,
      provider: 'strava',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: new Date(tokens.expires_at * 1000).toISOString(),
      extra_data: {
        athlete_id: tokens.athlete.id,
        athlete_name: `${tokens.athlete.firstname} ${tokens.athlete.lastname}`.trim(),
      },
    });

    return NextResponse.redirect(
      new URL('/settings?success=strava', request.url)
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Strava OAuth callback error:', msg);
    return NextResponse.redirect(
      new URL(`/settings?error=${encodeURIComponent(msg)}`, request.url)
    );
  }
}
