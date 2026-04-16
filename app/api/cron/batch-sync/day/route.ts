import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { syncStravaDayForUser } from '@/lib/sync-strava-user-day';

/** Strava + RunLog + satori 카드 + Instagram(컨테이너 폴링 ~45s+) — 60초면 타임아웃으로 IG 미게시가 잦음 */
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/batch-sync/day?date=YYYY-MM-DD
 * 하루 단위: Strava 활동 + (필수) 해당 날짜 Picker 사진 → RunLog 생성 → Instagram 게시.
 * 범위 일괄 처리는 클라이언트에서 날짜마다 호출 (서버 타임아웃·인스타 처리 시간 회피).
 */
export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest();
  if (!userId) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const dateStr = request.nextUrl.searchParams.get('date')?.trim() ?? '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return NextResponse.json(
      { error: 'date 쿼리는 YYYY-MM-DD 형식이어야 합니다.' },
      { status: 400 }
    );
  }

  const result = await syncStravaDayForUser(userId, dateStr, {
    requirePickedPhoto: true,
    skipIfRecordExists: true,
  });

  return NextResponse.json({
    ok: result.ok,
    date: result.date,
    synced: result.synced,
    skipped: result.skipped,
    skipReason: result.skipReason ?? null,
    recordId: result.recordId,
    igMediaId: result.igMediaId,
    log: result.log,
  });
}
