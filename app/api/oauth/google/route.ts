import { NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { getGoogleAuthUrl } from '@/lib/google-photos-api';

export const dynamic = 'force-dynamic';

export async function GET() {
  const userId = getUserIdFromRequest();
  if (!userId) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
  }

  const state = String(userId);
  const authUrl = getGoogleAuthUrl(state);
  return NextResponse.redirect(authUrl);
}
