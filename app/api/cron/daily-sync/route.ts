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
import {
  publishImagePost,
  refreshLongLivedToken,
} from '@/lib/instagram-api';
import { generateInstagramCard } from '@/lib/instagram-image';
import { runningRecords, userTokens, pickedPhotos } from '@/lib/db-supabase';
import { uploadImage } from '@/lib/blob-storage';

const AUTO_SYNC_USER_ID = parseInt(process.env.AUTO_SYNC_USER_ID || '0', 10);
const CRON_SECRET = process.env.CRON_SECRET;

export const maxDuration = 60;

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
      activities = [...activities, ...ingested].sort((a, b) =>
        (b.startTimeLocal || '').localeCompare(a.startTimeLocal || '')
      );
      log.push(`Apple(단축어): ${ingested.length}건 합류`);
    }
  } catch (err: unknown) {
    log.push(`Apple(단축어) error: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (activities.length === 0) {
    return NextResponse.json({ ok: true, log, synced: false });
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
  // ------------------------------------------------------------------
  let igMediaId: string | null = null;
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
