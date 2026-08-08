import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import type { StravaActivitySummary } from '@/lib/strava-api';
import {
  sumActivitiesMetrics,
  buildStravaRecordContent,
  buildStravaInstagramCaption,
  stravaSyncRecordTitle,
} from '@/lib/strava-api';
import { fetchDayActivitySummaries } from '@/lib/garmin-api';
import { loadIngestedWorkouts } from '@/lib/ingested-workouts';
import { mergeGarminAndIngested } from '@/lib/merge-activities';
import {
  publishImagePost,
  refreshLongLivedToken,
} from '@/lib/instagram-api';
import { generateInstagramCard } from '@/lib/instagram-image';
import { runningRecords, userTokens, pickedPhotos } from '@/lib/db-supabase';
import { uploadImage } from '@/lib/blob-storage';
import { isIgPublished, markIgPublished } from '@/lib/ig-published';
import { publishExistingRecordToInstagram } from '@/lib/publish-existing-record-instagram';

const AUTO_SYNC_USER_ID = parseInt(process.env.AUTO_SYNC_USER_ID || '0', 10);
const CRON_SECRET = process.env.CRON_SECRET;

/** Instagram 게시(컨테이너 폴링 ~45s+)까지 포함 — 60초면 IG 미게시가 잦음 */
export const maxDuration = 300;

/**
 * 밀린 게시 처리 시작일. 이 날짜 이전은 절대 건드리지 않는다 —
 * 표식(ig-published) 도입 전에 이미 게시된 과거 기록이 다시 올라가는 사고 방지.
 */
const IG_SWEEP_START = '2026-08-08';
/** 며칠 전까지 훑을지 */
const IG_SWEEP_DAYS = 3;
/** 한 번의 크론에서 밀린 게시 최대 건수 (IG 폴링 ~45s+ → 실행 제한 300s 안에 들어오도록) */
const IG_SWEEP_MAX = 1;

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * 사진이 없어 «보류»된 지난 날 중, 그 사이 사진이 도착한 날을 Instagram에 게시.
 *
 * 사진 자동화(iOS)가 저녁에 실행되지 않거나 늦게 실행되는 날이 있어, 그런 날은
 * 그라데이션으로 올리지 않고 사이트 기록만 만들어 둔다. 사진이 도착하면
 * auto-select가 기록 배경을 채우고, 다음 크론(이 함수)이 IG에 올린다.
 * 사진이 끝내 안 오면 게시하지 않는다(그라데이션 게시 방지).
 */
async function publishPendingDays(
  userId: number,
  todayStr: string,
  log: string[]
): Promise<void> {
  const to = shiftDate(todayStr, -1);
  if (to < IG_SWEEP_START) return;
  const from = (() => {
    const f = shiftDate(todayStr, -IG_SWEEP_DAYS);
    return f < IG_SWEEP_START ? IG_SWEEP_START : f;
  })();
  if (from > to) return;

  let dates: string[];
  try {
    // 배경 이미지가 있는 날짜만 = 사진이 (늦게라도) 도착한 날
    dates = await runningRecords.listRecordDatesWithImageInRange(userId, from, to);
  } catch (err: unknown) {
    log.push(`밀린 게시 조회 실패: ${err instanceof Error ? err.message : String(err)}`);
    return;
  }

  let done = 0;
  for (const dateStr of dates) {
    if (done >= IG_SWEEP_MAX) break;
    try {
      if (await isIgPublished(userId, dateStr)) continue;
      const recordId = await runningRecords.findIdByUserAndRecordDate(userId, dateStr);
      if (recordId == null) continue;
      const pub = await publishExistingRecordToInstagram(userId, recordId);
      if (pub.ok) {
        await markIgPublished(userId, dateStr, pub.igMediaId ?? null);
        log.push(`밀린 게시: ${dateStr} → Instagram ${pub.igMediaId ?? '(id 없음)'}`);
        done++;
      } else {
        log.push(`밀린 게시 실패(${dateStr}): ${pub.error ?? '알 수 없는 오류'}`);
      }
    } catch (err: unknown) {
      log.push(
        `밀린 게시 오류(${dateStr}): ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }
}

export async function GET(request: NextRequest) {
  const sessionUserId = getUserIdFromRequest();
  const bearerOk =
    !!CRON_SECRET &&
    request.headers.get('authorization') === `Bearer ${CRON_SECRET}`;

  /** Vercel Cron 등: Bearer + AUTO_SYNC_USER_ID. 설정 화면 «지금 동기화»: 로그인 세션 → 그 사용자의 Strava/사진/IG 사용 */
  if (CRON_SECRET && !bearerOk && !sessionUserId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let syncUserId: number;
  if (bearerOk) {
    if (!AUTO_SYNC_USER_ID) {
      return NextResponse.json(
        { error: 'AUTO_SYNC_USER_ID not configured (needed for cron)' },
        { status: 500 }
      );
    }
    syncUserId = AUTO_SYNC_USER_ID;
  } else if (sessionUserId) {
    syncUserId = sessionUserId;
  } else if (AUTO_SYNC_USER_ID) {
    syncUserId = AUTO_SYNC_USER_ID;
  } else {
    return NextResponse.json(
      { error: 'AUTO_SYNC_USER_ID not configured' },
      { status: 500 }
    );
  }

  const dateParam = request.nextUrl.searchParams.get('date');
  /**
   * requirePhoto=1: 아직 사진이 준비 안 됐으면 게시하지 않고 건너뜀.
   * iOS 사진 자동화가 지연 실행(폰 잠금 시)되면 21:00 게시가 사진을 놓치므로,
   * 이른 크론은 사진이 있을 때만 게시하고, 늦은 catch-up 크론이 최종 게시.
   */
  const requirePhoto = request.nextUrl.searchParams.get('requirePhoto') === '1';
  const kstToday = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' })
  ).toISOString().slice(0, 10);
  const todayStr =
    dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : kstToday;

  const log: string[] = [];
  log.push(
    bearerOk
      ? `동기화 사용자: cron (AUTO_SYNC_USER_ID=${syncUserId})`
      : sessionUserId
        ? `동기화 사용자: 로그인 계정 (user_id=${syncUserId})`
        : `동기화 사용자: 환경변수 기본 (AUTO_SYNC_USER_ID=${syncUserId})`
  );

  // 사진이 늦게 도착해 보류됐던 지난 날 먼저 게시 (날짜 지정 수동 실행에서는 건너뜀)
  if (!dateParam) {
    await publishPendingDays(syncUserId, todayStr, log);
  }

  // 중복 실행 방지: 크론 재시도·수동 중복 실행으로 같은 날짜 기록이 2개 생기는 사고 방지
  const existingId = await runningRecords.findIdByUserAndRecordDate(
    syncUserId,
    todayStr
  );
  if (existingId != null) {
    log.push(`건너뜀: ${todayStr} 기록이 이미 있음 (id=${existingId})`);
    return NextResponse.json({
      ok: true,
      synced: false,
      skipped: true,
      recordId: existingId,
      log,
    });
  }
  if (dateParam && todayStr === dateParam) {
    log.push(`날짜 지정: ${todayStr} (KST 오늘: ${kstToday})`);
  }

  // ------------------------------------------------------------------
  // 1. Garmin: fetch all activities for sync date (KST calendar day)
  //    (Strava Developer Program 유료화로 2026-07부터 Garmin Connect 사용)
  // ------------------------------------------------------------------
  let activities: StravaActivitySummary[] = [];
  try {
    activities = await fetchDayActivitySummaries(todayStr);
    if (activities.length > 0) {
      const detail = activities
        .map((a) => `${a.activityName} ${a.distanceKm}km`)
        .join(' · ');
      log.push(`Garmin: found ${activities.length} activity(ies) — ${detail}`);
    } else {
      log.push('Garmin: 해당 날짜 활동 없음');
    }
  } catch (err: unknown) {
    log.push(`Garmin error: ${err instanceof Error ? err.message : String(err)}`);
  }

  // Apple Watch(2026-07-09~): iPhone 단축어가 /api/workouts/ingest로 보낸 운동 합류
  try {
    const ingested = await loadIngestedWorkouts(syncUserId, todayStr);
    if (ingested.length > 0) {
      // Garmin·단축어에 같은 운동이 겹치면 중복 제거 (같은 종목 + 시작 ±10분)
      activities = mergeGarminAndIngested(activities, ingested);
      log.push(`Apple(단축어): ${ingested.length}건 합류 (중복 제거 후 총 ${activities.length}건)`);
    }
  } catch (err: unknown) {
    log.push(`Apple(단축어) error: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (activities.length === 0) {
    return NextResponse.json({ ok: true, log, synced: false });
  }

  // 이른 크론(requirePhoto): 사진이 아직 없으면 게시하지 않고 넘김 —
  // iOS 자동화 지연으로 사진이 늦게 도착하는 날은 뒤 catch-up 크론이 게시.
  if (requirePhoto) {
    const pickedNow = await pickedPhotos.findByDate(syncUserId, todayStr);
    if (!pickedNow?.blob_url) {
      log.push('사진 미준비 — 이 실행은 건너뜀 (뒤 크론이 게시)');
      return NextResponse.json({
        ok: true,
        synced: false,
        skipped: true,
        reason: 'photo_not_ready',
        log,
      });
    }
  }

  // ------------------------------------------------------------------
  // 2. Google Photos: use pre-selected photo from Picker API
  // ------------------------------------------------------------------
  let photoUrl: string | null = null;
  let photoBuffer: Buffer | null = null;
  try {
    const picked = await pickedPhotos.findByDate(syncUserId, todayStr);
    if (picked?.blob_url) {
      photoUrl = picked.blob_url;
      const res = await fetch(picked.blob_url);
      if (res.ok) {
        photoBuffer = Buffer.from(await res.arrayBuffer());
        log.push('Google Photos: using pre-selected photo from Picker');
      } else {
        log.push('Google Photos: pre-selected photo download failed, using URL only');
      }
    } else {
      log.push('Google Photos: no photo selected for today (use Settings to pick one)');
    }
  } catch (err: unknown) {
    log.push(`Google Photos error: ${err instanceof Error ? err.message : String(err)}`);
  }

  // ------------------------------------------------------------------
  // 3. Create RunLog running record
  // ------------------------------------------------------------------
  let recordId: number | null = null;
  try {
    const sums = sumActivitiesMetrics(activities);
    const record = await runningRecords.create({
      user_id: syncUserId,
      title: stravaSyncRecordTitle(activities, todayStr),
      content: buildStravaRecordContent(activities),
      image_url: photoUrl,
      distance: sums.totalDistanceKm > 0 ? sums.totalDistanceKm : null,
      duration: sums.totalDurationMinutes > 0 ? sums.totalDurationMinutes : null,
      record_date: todayStr,
      burned_calories: sums.totalCalories > 0 ? sums.totalCalories : null,
      sleep_hours: null,
      visibility: 'public',
    });
    recordId = record.id;
    log.push(`RunLog record created: id=${recordId}`);
  } catch (err: unknown) {
    log.push(`RunLog create error: ${err instanceof Error ? err.message : String(err)}`);
  }

  // ------------------------------------------------------------------
  // 4. Instagram: generate card image & publish
  //    사진이 없으면 게시하지 않고 보류 — 그라데이션 배경으로 올리는 대신,
  //    사진이 도착한 뒤 다음 크론의 publishPendingDays가 게시한다.
  // ------------------------------------------------------------------
  let igMediaId: string | null = null;
  if (!photoBuffer) {
    log.push(
      'Instagram: 사진 없음 — 게시 보류 (사진 도착 후 다음 크론이 게시)'
    );
    return NextResponse.json({
      ok: true,
      synced: true,
      recordId,
      igMediaId: null,
      igPending: true,
      log,
    });
  }
  try {
    const igToken = await userTokens.findByProvider(syncUserId, 'instagram');
    if (igToken?.access_token && igToken.extra_data) {
      let accessToken = igToken.access_token;

      const meRes = await fetch(
        `https://graph.instagram.com/me?fields=id&access_token=${accessToken}`
      );
      const meData = (await meRes.json()) as { id?: string; error?: unknown };
      const igUserId = meData.id;
      if (!igUserId) {
        log.push(`Instagram: failed to get user ID: ${JSON.stringify(meData)}`);
      } else {
        const storedId = String((igToken.extra_data as { ig_user_id?: string | number }).ig_user_id || '');
        if (storedId !== igUserId) {
          await userTokens.upsert({
            user_id: syncUserId,
            provider: 'instagram',
            access_token: accessToken,
            token_expires_at: igToken.token_expires_at,
            extra_data: { ig_user_id: igUserId },
          });
        }

        const expiresAt = igToken.token_expires_at
          ? new Date(igToken.token_expires_at).getTime()
          : 0;
        if (expiresAt > 0 && expiresAt - Date.now() < 7 * 24 * 3600 * 1000) {
          try {
            const refreshed = await refreshLongLivedToken(accessToken);
            accessToken = refreshed.access_token;
            await userTokens.upsert({
              user_id: syncUserId,
              provider: 'instagram',
              access_token: accessToken,
              token_expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
              extra_data: { ig_user_id: igUserId },
            });
            log.push('Instagram: token refreshed');
          } catch (refreshErr: unknown) {
            log.push(`Instagram token refresh warning: ${refreshErr instanceof Error ? refreshErr.message : String(refreshErr)}`);
          }
        }

        const cardBuffer = await generateInstagramCard(
          activities,
          photoBuffer,
          todayStr
        );
        const cardUrl = await uploadImage(cardBuffer, 'records');

        if (cardUrl) {
          const caption = buildStravaInstagramCaption(activities, todayStr);
          igMediaId = await publishImagePost(igUserId, accessToken, cardUrl, caption);
          log.push(`Instagram: published media ${igMediaId}`);
          // 다음 크론의 «밀린 게시»가 같은 날을 다시 올리지 않도록 표식
          await markIgPublished(syncUserId, todayStr, igMediaId);
        } else {
          log.push('Instagram: card image upload failed');
        }
      }
    } else {
      log.push('Instagram: not connected');
    }
  } catch (err: unknown) {
    log.push(`Instagram error: ${err instanceof Error ? err.message : String(err)}`);
  }

  return NextResponse.json({
    ok: true,
    synced: true,
    recordId,
    igMediaId,
    log,
  });
}
