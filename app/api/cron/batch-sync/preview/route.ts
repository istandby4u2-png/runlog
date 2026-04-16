import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { pickedPhotos, runningRecords } from '@/lib/db-supabase';

export const dynamic = 'force-dynamic';

const MAX_RANGE_DAYS = 120;

/**
 * GET /api/cron/batch-sync/preview?from=YYYY-MM-DD&to=YYYY-MM-DD
 * - 기본: 사진이 선택된 날짜 중 아직 RunLog가 없는 날짜 (일괄 동기화 대기).
 * - instagramOnly=1: 기간 안에서 배경 이미지(URL)가 있는 RunLog 날짜 (Instagram만 게시 대기).
 */
export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest();
  if (!userId) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const sp = request.nextUrl.searchParams;
  const from = sp.get('from')?.trim() ?? '';
  const to = sp.get('to')?.trim() ?? '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    return NextResponse.json(
      { error: 'from, to 쿼리는 YYYY-MM-DD 형식이어야 합니다.' },
      { status: 400 }
    );
  }
  if (from > to) {
    return NextResponse.json({ error: 'from은 to보다 이전이어야 합니다.' }, { status: 400 });
  }

  const start = new Date(`${from}T00:00:00Z`).getTime();
  const end = new Date(`${to}T00:00:00Z`).getTime();
  const days = Math.floor((end - start) / (24 * 3600 * 1000)) + 1;
  if (days > MAX_RANGE_DAYS) {
    return NextResponse.json(
      { error: `조회 범위는 최대 ${MAX_RANGE_DAYS}일까지입니다.` },
      { status: 400 }
    );
  }

  const instagramOnly =
    sp.get('instagramOnly') === '1' || sp.get('mode') === 'instagram_only';

  try {
    if (instagramOnly) {
      const withImage = await runningRecords.listRecordDatesWithImageInRange(
        userId,
        from,
        to
      );
      return NextResponse.json({
        ok: true,
        mode: 'instagram_only',
        from,
        to,
        pendingDates: withImage,
        datesWithImageRecord: withImage,
        counts: {
          withImageRecord: withImage.length,
          pending: withImage.length,
        },
      });
    }

    const [withPhoto, existingRecordDates] = await Promise.all([
      pickedPhotos.findPhotoDatesInRange(userId, from, to),
      runningRecords.listRecordDatesInRange(userId, from, to),
    ]);
    const existing = new Set(existingRecordDates);
    const pendingDates = withPhoto.filter((d) => !existing.has(d));
    return NextResponse.json({
      ok: true,
      mode: 'full_sync',
      from,
      to,
      datesWithPhoto: withPhoto,
      datesAlreadySynced: withPhoto.filter((d) => existing.has(d)),
      pendingDates,
      counts: {
        withPhoto: withPhoto.length,
        alreadySynced: withPhoto.length - pendingDates.length,
        pending: pendingDates.length,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
