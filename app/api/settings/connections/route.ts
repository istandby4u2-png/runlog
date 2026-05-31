import { NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { userTokens } from '@/lib/db-supabase';

export const dynamic = 'force-dynamic';

export type ConnectionStatus = {
  connected: boolean;
  /** ISO timestamp — short-lived access token expiry (not connection expiry) */
  expiresAt?: string | null;
  /** Strava: refresh token present → access token auto-refreshed on sync */
  autoRefresh?: boolean;
  athleteName?: string;
};

export async function GET() {
  const userId = getUserIdFromRequest();
  if (!userId) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const tokens = await userTokens.findAllByUser(userId);

  const connections: Record<string, ConnectionStatus> = {
    strava: { connected: false },
    google_photos: { connected: false },
    instagram: { connected: false },
  };

  for (const t of tokens) {
    if (t.provider === 'strava') {
      const extra = t.extra_data as { athlete_name?: string } | null;
      connections.strava = {
        connected: true,
        expiresAt: t.token_expires_at,
        autoRefresh: true,
        athleteName:
          typeof extra?.athlete_name === 'string' ? extra.athlete_name : undefined,
      };
    } else if (t.provider === 'google_photos') {
      connections.google_photos = {
        connected: true,
        expiresAt: t.token_expires_at,
      };
    } else if (t.provider === 'instagram') {
      connections.instagram = {
        connected: true,
        expiresAt: t.token_expires_at,
      };
    }
  }

  return NextResponse.json(connections);
}
