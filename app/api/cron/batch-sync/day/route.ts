import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { syncStravaDayForUser } from '@/lib/sync-strava-user-day';
import { publishExistingRecordToInstagram } from '@/lib/publish-existing-record-instagram';
import { runningRecords } from '@/lib/db-supabase';

/** Strava + RunLog + satori 카드 + Instagram(컨테이너 폴링 ~45s+) — 60초면 타임아웃으로 IG 미게시가 잦음 */
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/batch-sync/day?date=YYYY-MM-DD
 * 하루 단위: Strava 활동 + (필수) 해당 날짜 Picker 사진 → RunLog 생성 → Instagram 게시.
 * GET ...&instagramOnly=1 — 이미 있는 해당 날짜 RunLog만 Instagram에 게시 (피드 생성/Strava 생략).
 * 범위 일괄 처리는 클라이언트에서 날짜마다 호출 (서버 타임아웃·인스타 처리 시간 회피).
 */
export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest();
  if (!userId) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const sp = request.nextUrl.searchParams;
  const dateStr = sp.get('date')?.trim() ?? '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return NextResponse.json(
      { error: 'date 쿼리는 YYYY-MM-DD 형식이어야 합니다.' },
      { status: 400 }
    );
  }

  const instagramOnly =
    sp.get('instagramOnly') === '1' || sp.get('mode') === 'instagram_only';

  if (instagramOnly) {
    const recordId = await runningRecords.findIdByUserAndRecordDate(
      userId,
      dateStr
    );
    if (recordId == null) {
      return NextResponse.json({
        ok: true,
        mode: 'instagram_only',
        date: dateStr,
        synced: false,
        skipped: true,
        skipReason: 'no_record',
        recordId: null,
        igMediaId: null,
        log: [`날짜 ${dateStr}: RunLog 기록이 없습니다.`],
      });
    }

    const record = await runningRecords.findById(recordId, userId);
    if (!record?.image_url?.trim()) {
      return NextResponse.json({
        ok: true,
        mode: 'instagram_only',
        date: dateStr,
        synced: false,
        skipped: true,
        skipReason: 'no_image',
        recordId,
        igMediaId: null,
        log: [`record #${recordId}: 배경 이미지(URL)가 없어 카드를 만들 수 없습니다.`],
      });
    }

    const pub = await publishExistingRecordToInstagram(userId, recordId);
    if (!pub.ok) {
      return NextResponse.json(
        {
          ok: false,
          mode: 'instagram_only',
          error: pub.error ?? 'Instagram 게시 실패',
          date: dateStr,
          synced: false,
          skipped: false,
          recordId,
          igMediaId: null,
          log: pub.log ?? [],
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      mode: 'instagram_only',
      date: dateStr,
      synced: true,
      skipped: false,
      recordId,
      igMediaId: pub.igMediaId ?? null,
      log: pub.log ?? [],
    });
  }

  const result = await syncStravaDayForUser(userId, dateStr, {
    requirePickedPhoto: true,
    skipIfRecordExists: true,
  });

  return NextResponse.json({
    ok: result.ok,
    mode: 'full_sync',
    date: result.date,
    synced: result.synced,
    skipped: result.skipped,
    skipReason: result.skipReason ?? null,
    recordId: result.recordId,
    igMediaId: result.igMediaId,
    log: result.log,
  });
}
