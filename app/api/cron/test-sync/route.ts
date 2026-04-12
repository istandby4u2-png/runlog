import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import type { StravaActivitySummary } from '@/lib/strava-api';
import {
  getValidAccessToken,
  fetchActivitiesByDate as fetchStravaByDate,
} from '@/lib/strava-api';
import {
  publishImagePost,
  refreshLongLivedToken,
} from '@/lib/instagram-api';
import { generateInstagramCard } from '@/lib/instagram-image';
import { runningRecords, userTokens, pickedPhotos } from '@/lib/db-supabase';
import { uploadImage } from '@/lib/blob-storage';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/**
 * Manual test endpoint.
 *
 * Usage:
 *   /api/cron/test-sync?date=2026-03-09
 *   /api/cron/test-sync?date=2026-03-09&dist=10.5&dur=55&pace=5.2&cal=520&title=Morning+Run
 *
 * Uses Strava for activity data. Falls back to query params if Strava fails.
 */
export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest();
  if (!userId) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const sp = request.nextUrl.searchParams;
  const dateParam = sp.get('date');
  if (!dateParam || !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    return NextResponse.json(
      { error: 'date query parameter required (YYYY-MM-DD format)' },
      { status: 400 }
    );
  }

  const dateStr = dateParam;
  const log: string[] = [`Target date: ${dateStr}`];

  // ------------------------------------------------------------------
  // 1. Activity data: try Strava first, fall back to query params
  // ------------------------------------------------------------------
  let activity: StravaActivitySummary | null = null;

  try {
    const stravaToken = await userTokens.findByProvider(userId, 'strava');
    if (stravaToken?.refresh_token) {
      const valid = await getValidAccessToken({
        access_token: stravaToken.access_token,
        refresh_token: stravaToken.refresh_token,
        token_expires_at: stravaToken.token_expires_at,
      });

      if (valid.access_token !== stravaToken.access_token) {
        await userTokens.upsert({
          user_id: userId,
          provider: 'strava',
          access_token: valid.access_token,
          refresh_token: valid.refresh_token,
          token_expires_at: new Date(valid.expires_at * 1000).toISOString(),
        });
        log.push('Strava: token refreshed');
      }

      const activities = await fetchStravaByDate(valid.access_token, dateStr, {
        debugLog: log,
      });
      if (activities.length > 0) {
        activity = activities[0];
        log.push(
          `Strava: found ${activities.length} activity(ies) — ` +
          `${activity.activityName} ${activity.distanceKm}km`
        );
      } else {
        log.push(`Strava: 해당 날짜 활동 없음 (${dateStr})`);
      }
    } else {
      log.push('Strava: not connected');
    }
  } catch (err: unknown) {
    log.push(`Strava error (falling back to manual data): ${err instanceof Error ? err.message : String(err)}`);
  }

  // Fall back to query params
  if (!activity) {
    const dist = parseFloat(sp.get('dist') || '');
    const dur = parseInt(sp.get('dur') || '', 10);

    if (!dist || !dur) {
      return NextResponse.json({
        ok: false,
        error: 'Strava에 활동 데이터가 없습니다. 수동 데이터를 쿼리 파라미터로 전달해주세요.',
        usage: '/api/cron/test-sync?date=2026-03-09&dist=10.5&dur=55&pace=5.2&cal=520&title=Morning+Run',
        log,
      });
    }

    activity = {
      activityId: 0,
      activityName: sp.get('title') || `Running ${dateStr}`,
      startTimeLocal: `${dateStr}T07:00:00`,
      distanceKm: Math.round(dist * 100) / 100,
      durationMinutes: dur,
      calories: parseInt(sp.get('cal') || '', 10) || 0,
      averageHR: 0,
      maxHR: 0,
      elevationGain: 0,
      averagePaceMinPerKm: parseFloat(sp.get('pace') || '') || null,
      locationName: '',
    };
    log.push(`Manual data: ${activity.activityName} ${dist}km ${dur}min`);
  }

  // ------------------------------------------------------------------
  // 2. Google Photos: use pre-selected photo from Picker API
  // ------------------------------------------------------------------
  let photoUrl: string | null = null;
  let photoBuffer: Buffer | null = null;
  try {
    const picked = await pickedPhotos.findByDate(userId, dateStr);
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
      log.push(`Google Photos: no photo selected for ${dateStr} (use Settings to pick one)`);
    }
  } catch (err: unknown) {
    log.push(`Google Photos error: ${err instanceof Error ? err.message : String(err)}`);
  }

  // ------------------------------------------------------------------
  // 3. Create RunLog running record
  // ------------------------------------------------------------------
  let recordId: number | null = null;
  try {
    const record = await runningRecords.create({
      user_id: userId,
      title: activity.activityName || `Running ${dateStr}`,
      content: buildRecordContent(activity),
      image_url: photoUrl,
      distance: activity.distanceKm || null,
      duration: activity.durationMinutes || null,
      record_date: dateStr,
      burned_calories: activity.calories || null,
      sleep_hours: null,
      visibility: 'public',
    });
    recordId = record.id;
    log.push(`RunLog record created: id=${recordId}`);
  } catch (err: unknown) {
    log.push(`RunLog create error: ${err instanceof Error ? err.message : String(err)}`);
  }

  // ------------------------------------------------------------------
  // 4. Instagram
  // ------------------------------------------------------------------
  let igMediaId: string | null = null;
  try {
    const igToken = await userTokens.findByProvider(userId, 'instagram');
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
            user_id: userId,
            provider: 'instagram',
            access_token: accessToken,
            token_expires_at: igToken.token_expires_at,
            extra_data: { ig_user_id: igUserId },
          });
          log.push(`Instagram: corrected ig_user_id`);
        }

        const expiresAt = igToken.token_expires_at
          ? new Date(igToken.token_expires_at).getTime()
          : 0;
        if (expiresAt > 0 && expiresAt - Date.now() < 7 * 24 * 3600 * 1000) {
          try {
            const refreshed = await refreshLongLivedToken(accessToken);
            accessToken = refreshed.access_token;
            await userTokens.upsert({
              user_id: userId,
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

        const cardBuffer = await generateInstagramCard(activity, photoBuffer);
        const cardUrl = await uploadImage(cardBuffer, 'records');

        if (cardUrl) {
          const caption = buildInstagramCaption(activity, dateStr);
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

function buildRecordContent(a: StravaActivitySummary): string {
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
  parts.push('(Strava 자동 동기화)');
  return parts.join('\n');
}

function buildInstagramCaption(a: StravaActivitySummary, dateStr: string): string {
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
  parts.push('#RunLog #running #러닝 #달리기 #strava');
  return parts.join('\n');
}
