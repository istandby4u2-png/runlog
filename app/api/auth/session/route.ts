import { NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/** HttpOnly `token` 쿠키는 document.cookie에 없음 — 클라이언트 헤더용 로그인 여부 */
export async function GET() {
  const userId = getUserIdFromRequest();
  return NextResponse.json({ authenticated: userId != null });
}
