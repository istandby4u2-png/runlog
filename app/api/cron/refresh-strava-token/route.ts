import { NextRequest, NextResponse } from 'next/server';
import { refreshStravaTokensForAllUsers } from '@/lib/strava-token';

const CRON_SECRET = process.env.CRON_SECRET;

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Proactively refresh Strava access tokens (daily via Vercel Cron; Hobby plan allows once/day).
 * Keeps refresh tokens exercised and access tokens warm before daily sync.
 */
export async function GET(request: NextRequest) {
  if (CRON_SECRET) {
    const bearerOk =
      request.headers.get('authorization') === `Bearer ${CRON_SECRET}`;
    if (!bearerOk) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const result = await refreshStravaTokensForAllUsers();
    return NextResponse.json({ ok: true, ...result });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
