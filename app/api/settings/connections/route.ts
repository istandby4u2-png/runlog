import { NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { userTokens } from '@/lib/db-supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const userId = getUserIdFromRequest();
  if (!userId) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const tokens = await userTokens.findAllByUser(userId);

  const connections: Record<string, { connected: boolean; expiresAt?: string | null }> = {
    strava: { connected: false },
    google_photos: { connected: false },
    instagram: { connected: false },
  };

  for (const t of tokens) {
    if (t.provider === 'strava' || t.provider === 'google_photos' || t.provider === 'instagram') {
      connections[t.provider] = {
        connected: true,
        expiresAt: t.token_expires_at,
      };
    }
  }

  return NextResponse.json(connections);
}
