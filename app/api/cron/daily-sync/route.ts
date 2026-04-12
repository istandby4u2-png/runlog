import { NextRequest, NextResponse } from 'next/server';
import { fetchTodayActivities, fetchSleepData } from '@/lib/garmin-api';
import {
  refreshAccessToken,
  searchPhotosByDate,
  downloadPhotoAsBuffer,
} from '@/lib/google-photos-api';
import {
  publishImagePost,
  refreshLongLivedToken,
} from '@/lib/instagram-api';
import { generateInstagramCard } from '@/lib/instagram-image';
import { runningRecords, userTokens } from '@/lib/db-supabase';
import { uploadImage } from '@/lib/blob-storage';

const AUTO_SYNC_USER_ID = parseInt(process.env.AUTO_SYNC_USER_ID || '0', 10);
const CRON_SECRET = process.env.CRON_SECRET;

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  // Verify Vercel cron secret
  if (CRON_SECRET) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  if (!AUTO_SYNC_USER_ID) {
    return NextResponse.json(
      { error: 'AUTO_SYNC_USER_ID not configured' },
      { status: 500 }
    );
  }

  const log: string[] = [];
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  // ------------------------------------------------------------------
  // 1. Garmin: fetch today's running activities
  // ------------------------------------------------------------------
  let garminActivity: Awaited<ReturnType<typeof fetchTodayActivities>>[number] | null = null;
  try {
    const activities = await fetchTodayActivities();
    if (activities.length > 0) {
      garminActivity = activities[0];
      log.push(`Garmin: found ${activities.length} activity(ies) — ${garminActivity.activityName} ${garminActivity.distanceKm}km`);
    } else {
      log.push('Garmin: no running activities today, skipping record creation');
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
    const sleep = await fetchSleepData(today);
    if (sleep) {
      sleepHours = Math.round(sleep.hours * 10) / 10;
      log.push(`Garmin sleep: ${sleepHours}h`);
    }
  } catch (err: unknown) {
    log.push(`Garmin sleep error: ${err instanceof Error ? err.message : String(err)}`);
  }

  // ------------------------------------------------------------------
  // 3. Google Photos: fetch today's photo
  // ------------------------------------------------------------------
  let photoUrl: string | null = null;
  let photoBuffer: Buffer | null = null;
  try {
    const gpToken = await userTokens.findByProvider(AUTO_SYNC_USER_ID, 'google_photos');
    if (gpToken?.refresh_token) {
      const { access_token } = await refreshAccessToken(gpToken.refresh_token);

      // Update stored access token
      await userTokens.upsert({
        user_id: AUTO_SYNC_USER_ID,
        provider: 'google_photos',
        access_token,
        refresh_token: gpToken.refresh_token,
        token_expires_at: new Date(Date.now() + 3500 * 1000).toISOString(),
      });

      const photos = await searchPhotosByDate(access_token, today);
      if (photos.length > 0) {
        const { buffer, contentType } = await downloadPhotoAsBuffer(
          photos[0].baseUrl,
          access_token
        );
        photoBuffer = buffer;
        photoUrl = await uploadImage(buffer, 'records');
        log.push(`Google Photos: uploaded (${photos.length} found for ${todayStr})`);
      } else {
        log.push('Google Photos: no photos for today');
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
      user_id: AUTO_SYNC_USER_ID,
      title: garminActivity.activityName || `Running ${todayStr}`,
      content: buildRecordContent(garminActivity),
      image_url: photoUrl,
      distance: garminActivity.distanceKm || null,
      duration: garminActivity.durationMinutes || null,
      record_date: todayStr,
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
    const igToken = await userTokens.findByProvider(AUTO_SYNC_USER_ID, 'instagram');
    if (igToken?.access_token && igToken.extra_data) {
      const igUserId = (igToken.extra_data as { ig_user_id?: string }).ig_user_id;
      if (!igUserId) {
        log.push('Instagram: ig_user_id missing in token data');
      } else {
        // Auto-refresh if token expires within 7 days
        const expiresAt = igToken.token_expires_at
          ? new Date(igToken.token_expires_at).getTime()
          : 0;
        let accessToken = igToken.access_token;
        if (expiresAt > 0 && expiresAt - Date.now() < 7 * 24 * 3600 * 1000) {
          try {
            const refreshed = await refreshLongLivedToken(accessToken);
            accessToken = refreshed.access_token;
            await userTokens.upsert({
              user_id: AUTO_SYNC_USER_ID,
              provider: 'instagram',
              access_token: accessToken,
              token_expires_at: new Date(
                Date.now() + refreshed.expires_in * 1000
              ).toISOString(),
              extra_data: igToken.extra_data as Record<string, unknown>,
            });
            log.push('Instagram: token refreshed');
          } catch (refreshErr: unknown) {
            log.push(`Instagram token refresh warning: ${refreshErr instanceof Error ? refreshErr.message : String(refreshErr)}`);
          }
        }

        // Generate Instagram card image
        const cardBuffer = await generateInstagramCard(garminActivity, photoBuffer);
        const cardUrl = await uploadImage(cardBuffer, 'records');

        if (cardUrl) {
          const caption = buildInstagramCaption(garminActivity, todayStr);
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

function buildRecordContent(a: Awaited<ReturnType<typeof fetchTodayActivities>>[number]): string {
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
  a: Awaited<ReturnType<typeof fetchTodayActivities>>[number],
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
