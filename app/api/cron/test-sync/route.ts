import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { fetchActivitiesByDate, fetchSleepData } from '@/lib/garmin-api';
import {
  refreshAccessToken,
  searchPhotosByDate,
  searchPhotosByDateAndContent,
  downloadPhotoAsBuffer,
} from '@/lib/google-photos-api';
import {
  publishImagePost,
  refreshLongLivedToken,
} from '@/lib/instagram-api';
import { generateInstagramCard } from '@/lib/instagram-image';
import { runningRecords, userTokens } from '@/lib/db-supabase';
import { uploadImage } from '@/lib/blob-storage';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/**
 * Manual test endpoint: GET /api/cron/test-sync?date=2026-03-09
 * Requires user login (no CRON_SECRET needed).
 */
export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest();
  if (!userId) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const syncUserId = userId;

  const dateParam = request.nextUrl.searchParams.get('date');
  if (!dateParam || !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    return NextResponse.json(
      { error: 'date query parameter required (YYYY-MM-DD format)' },
      { status: 400 }
    );
  }

  const targetDate = new Date(dateParam + 'T12:00:00+09:00');
  const dateStr = dateParam;
  const log: string[] = [`Target date: ${dateStr}`];

  // ------------------------------------------------------------------
  // 1. Garmin: fetch activities for the target date
  // ------------------------------------------------------------------
  let garminActivity: Awaited<ReturnType<typeof fetchActivitiesByDate>>[number] | null = null;
  try {
    const activities = await fetchActivitiesByDate(dateStr);
    if (activities.length > 0) {
      garminActivity = activities[0];
      log.push(
        `Garmin: found ${activities.length} activity(ies) — ` +
        `${garminActivity.activityName} ${garminActivity.distanceKm}km`
      );
    } else {
      log.push(`Garmin: no running activities for ${dateStr}`);
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    log.push(`Garmin error: ${msg}`);
  }

  if (!garminActivity) {
    return NextResponse.json({ ok: true, log, synced: false });
  }

  // ------------------------------------------------------------------
  // 2. Garmin: fetch sleep data
  // ------------------------------------------------------------------
  let sleepHours: number | null = null;
  try {
    const sleep = await fetchSleepData(targetDate);
    if (sleep) {
      sleepHours = Math.round(sleep.hours * 10) / 10;
      log.push(`Garmin sleep: ${sleepHours}h`);
    }
  } catch (err: unknown) {
    log.push(`Garmin sleep error: ${err instanceof Error ? err.message : String(err)}`);
  }

  // ------------------------------------------------------------------
  // 3. Google Photos: fetch landscape photo for the target date
  // ------------------------------------------------------------------
  let photoUrl: string | null = null;
  let photoBuffer: Buffer | null = null;
  try {
    const gpToken = await userTokens.findByProvider(syncUserId, 'google_photos');
    if (gpToken?.refresh_token) {
      const { access_token } = await refreshAccessToken(gpToken.refresh_token);

      await userTokens.upsert({
        user_id: syncUserId,
        provider: 'google_photos',
        access_token,
        refresh_token: gpToken.refresh_token,
        token_expires_at: new Date(Date.now() + 3500 * 1000).toISOString(),
      });

      let photos = await searchPhotosByDateAndContent(access_token, targetDate, ['LANDSCAPES']);
      let selectedSource = 'landscape';

      if (photos.length === 0) {
        photos = await searchPhotosByDate(access_token, targetDate);
        selectedSource = 'any';
      }

      if (photos.length > 0) {
        const { buffer } = await downloadPhotoAsBuffer(photos[0].baseUrl, access_token);
        photoBuffer = buffer;
        photoUrl = await uploadImage(buffer, 'records');
        log.push(
          `Google Photos: uploaded ${selectedSource} photo ` +
          `(${photos.length} ${selectedSource} found for ${dateStr})`
        );
      } else {
        log.push(`Google Photos: no photos for ${dateStr}`);
      }
    } else {
      log.push('Google Photos: not connected (no refresh_token)');
    }
  } catch (err: unknown) {
    log.push(`Google Photos error: ${err instanceof Error ? err.message : String(err)}`);
  }

  // ------------------------------------------------------------------
  // 4. Create RunLog running record
  // ------------------------------------------------------------------
  let recordId: number | null = null;
  try {
    const record = await runningRecords.create({
      user_id: syncUserId,
      title: garminActivity.activityName || `Running ${dateStr}`,
      content: buildRecordContent(garminActivity),
      image_url: photoUrl,
      distance: garminActivity.distanceKm || null,
      duration: garminActivity.durationMinutes || null,
      record_date: dateStr,
      burned_calories: garminActivity.calories || null,
      sleep_hours: sleepHours,
      visibility: 'public',
    });
    recordId = record.id;
    log.push(`RunLog record created: id=${recordId}`);
  } catch (err: unknown) {
    log.push(`RunLog create error: ${err instanceof Error ? err.message : String(err)}`);
  }

  // ------------------------------------------------------------------
  // 5. Instagram: generate card image & publish
  // ------------------------------------------------------------------
  let igMediaId: string | null = null;
  try {
    const igToken = await userTokens.findByProvider(syncUserId, 'instagram');
    if (igToken?.access_token && igToken.extra_data) {
      const igUserId = (igToken.extra_data as { ig_user_id?: string }).ig_user_id;
      if (!igUserId) {
        log.push('Instagram: ig_user_id missing in token data');
      } else {
        let accessToken = igToken.access_token;

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
              extra_data: igToken.extra_data as Record<string, unknown>,
            });
            log.push('Instagram: token refreshed');
          } catch (refreshErr: unknown) {
            log.push(`Instagram token refresh warning: ${refreshErr instanceof Error ? refreshErr.message : String(refreshErr)}`);
          }
        }

        const cardBuffer = await generateInstagramCard(garminActivity, photoBuffer);
        const cardUrl = await uploadImage(cardBuffer, 'records');

        if (cardUrl) {
          const caption = buildInstagramCaption(garminActivity, dateStr);
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
    date: dateStr,
    recordId,
    igMediaId,
    log,
  });
}

function buildRecordContent(a: Awaited<ReturnType<typeof fetchActivitiesByDate>>[number]): string {
  const parts: string[] = [];
  if (a.distanceKm > 0) parts.push(`거리: ${a.distanceKm}km`);
  if (a.durationMinutes > 0) {
    const h = Math.floor(a.durationMinutes / 60);
    const m = a.durationMinutes % 60;
    parts.push(`시간: ${h > 0 ? `${h}시간 ` : ''}${m}분`);
  }
  if (a.averagePaceMinPerKm) {
    const mins = Math.floor(a.averagePaceMinPerKm);
    const secs = Math.round((a.averagePaceMinPerKm - mins) * 60);
    parts.push(`평균 페이스: ${mins}'${secs.toString().padStart(2, '0')}"/km`);
  }
  if (a.calories > 0) parts.push(`소모 칼로리: ${a.calories}kcal`);
  if (a.averageHR > 0) parts.push(`평균 심박: ${a.averageHR}bpm`);
  if (a.elevationGain > 0) parts.push(`고도 상승: ${a.elevationGain}m`);
  parts.push('(Garmin 자동 동기화)');
  return parts.join('\n');
}

function buildInstagramCaption(
  a: Awaited<ReturnType<typeof fetchActivitiesByDate>>[number],
  dateStr: string
): string {
  const parts: string[] = [];
  parts.push(`🏃 ${a.activityName}`);
  parts.push(`📅 ${dateStr}`);
  if (a.distanceKm > 0) parts.push(`📏 ${a.distanceKm}km`);
  if (a.durationMinutes > 0) {
    const h = Math.floor(a.durationMinutes / 60);
    const m = a.durationMinutes % 60;
    parts.push(`⏱ ${h > 0 ? `${h}h ` : ''}${m}m`);
  }
  if (a.calories > 0) parts.push(`🔥 ${a.calories}kcal`);
  parts.push('');
  parts.push('#RunLog #running #러닝 #달리기 #garmin');
  return parts.join('\n');
}
