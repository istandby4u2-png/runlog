/**
 * Strava + RunLog + Instagram flow for a single user and calendar day (KST date string).
 * Used by batch backfill and can be shared by test-sync later.
 */

import type { StravaActivitySummary } from '@/lib/strava-api';
import {
  getValidAccessToken,
  fetchActivitiesByDate,
  sumActivitiesMetrics,
  buildStravaRecordContent,
  buildStravaInstagramCaption,
  stravaSyncRecordTitle,
} from '@/lib/strava-api';
import { generateInstagramCard } from '@/lib/instagram-image';
import { publishPublicImageToInstagramForUser } from '@/lib/instagram-user-publish';
import { runningRecords, userTokens, pickedPhotos } from '@/lib/db-supabase';
import { uploadPublicJpegWithFallback } from '@/lib/blob-storage';

export type SyncStravaDayResult = {
  ok: boolean;
  date: string;
  synced: boolean;
  skipped: boolean;
  skipReason?:
    | 'already_exists'
    | 'no_photo'
    | 'no_strava'
    | 'strava_not_connected';
  recordId: number | null;
  igMediaId: string | null;
  log: string[];
};

export async function syncStravaDayForUser(
  userId: number,
  dateStr: string,
  options: {
    /** 배치용: 해당 날짜에 Picker로 저장된 사진이 있어야만 진행 */
    requirePickedPhoto: boolean;
    /** 이미 같은 record_date 기록이 있으면 건너뜀 */
    skipIfRecordExists: boolean;
  }
): Promise<SyncStravaDayResult> {
  const log: string[] = [`날짜: ${dateStr}`];

  if (options.skipIfRecordExists) {
    const existing = await runningRecords.findIdByUserAndRecordDate(userId, dateStr);
    if (existing != null) {
      log.push(`건너뜀: 이미 기록 있음 (record id=${existing})`);
      return {
        ok: true,
        date: dateStr,
        synced: false,
        skipped: true,
        skipReason: 'already_exists',
        recordId: null,
        igMediaId: null,
        log,
      };
    }
  }

  let activities: StravaActivitySummary[] = [];
  try {
    const stravaToken = await userTokens.findByProvider(userId, 'strava');
    if (!stravaToken?.refresh_token) {
      log.push('Strava: not connected');
      return {
        ok: true,
        date: dateStr,
        synced: false,
        skipped: true,
        skipReason: 'strava_not_connected',
        recordId: null,
        igMediaId: null,
        log,
      };
    }

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

    activities = await fetchActivitiesByDate(valid.access_token, dateStr);
    if (activities.length > 0) {
      const detail = activities
        .map((a) => `${a.activityName} ${a.distanceKm}km`)
        .join(' · ');
      log.push(`Strava: ${activities.length}건 — ${detail}`);
    } else {
      log.push('Strava: 해당 날짜 활동 없음');
    }
  } catch (err: unknown) {
    log.push(`Strava error: ${err instanceof Error ? err.message : String(err)}`);
    return {
      ok: false,
      date: dateStr,
      synced: false,
      skipped: false,
      recordId: null,
      igMediaId: null,
      log,
    };
  }

  if (activities.length === 0) {
    return {
      ok: true,
      date: dateStr,
      synced: false,
      skipped: true,
      skipReason: 'no_strava',
      recordId: null,
      igMediaId: null,
      log,
    };
  }

  let photoUrl: string | null = null;
  let photoBuffer: Buffer | null = null;
  try {
    const picked = await pickedPhotos.findByDate(userId, dateStr);
    if (picked?.blob_url) {
      photoUrl = picked.blob_url;
      const res = await fetch(picked.blob_url);
      if (res.ok) {
        photoBuffer = Buffer.from(await res.arrayBuffer());
        log.push('Google Photos: 배경 사진 사용');
      } else {
        log.push('Google Photos: 사진 다운로드 실패, URL만 저장');
      }
    } else {
      log.push('Google Photos: 해당 날짜 사진 없음');
    }
  } catch (err: unknown) {
    log.push(`Google Photos error: ${err instanceof Error ? err.message : String(err)}`);
  }

  if (options.requirePickedPhoto && !photoUrl) {
    return {
      ok: true,
      date: dateStr,
      synced: false,
      skipped: true,
      skipReason: 'no_photo',
      recordId: null,
      igMediaId: null,
      log,
    };
  }

  let recordId: number | null = null;
  try {
    const sums = sumActivitiesMetrics(activities);
    const record = await runningRecords.create({
      user_id: userId,
      title: stravaSyncRecordTitle(activities, dateStr),
      content: buildStravaRecordContent(activities),
      image_url: photoUrl,
      distance: sums.totalDistanceKm > 0 ? sums.totalDistanceKm : null,
      duration: sums.totalDurationMinutes > 0 ? sums.totalDurationMinutes : null,
      record_date: dateStr,
      burned_calories: sums.totalCalories > 0 ? sums.totalCalories : null,
      sleep_hours: null,
      visibility: 'public',
    });
    recordId = record.id;
    log.push(`RunLog 기록 생성: id=${recordId}`);
  } catch (err: unknown) {
    log.push(`RunLog create error: ${err instanceof Error ? err.message : String(err)}`);
    return {
      ok: false,
      date: dateStr,
      synced: false,
      skipped: false,
      recordId: null,
      igMediaId: null,
      log,
    };
  }

  let igMediaId: string | null = null;
  try {
    const igToken = await userTokens.findByProvider(userId, 'instagram');
    if (igToken?.access_token && igToken.extra_data) {
      const cardBuffer = await generateInstagramCard(activities, photoBuffer);
      const uploaded = await uploadPublicJpegWithFallback(cardBuffer, 'records');

      if (uploaded.ok) {
        if (uploaded.storage === 'supabase') {
          log.push('Instagram 카드: Supabase Storage에 업로드 (Blob 폴백)');
        }
        const caption = buildStravaInstagramCaption(activities, dateStr);
        const pub = await publishPublicImageToInstagramForUser(
          userId,
          uploaded.url,
          caption
        );
        igMediaId = pub.igMediaId;
        log.push(...pub.log);
      } else {
        log.push(`Instagram: 카드 업로드 실패 — ${uploaded.error}`);
      }
    } else {
      log.push('Instagram: 미연결');
    }
  } catch (err: unknown) {
    log.push(`Instagram error: ${err instanceof Error ? err.message : String(err)}`);
  }

  return {
    ok: true,
    date: dateStr,
    synced: true,
    skipped: false,
    recordId,
    igMediaId,
    log,
  };
}
