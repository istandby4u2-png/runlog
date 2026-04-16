/**
 * 이미 RunLog에 있는 기록을 Strava·DB 데이터로 카드 생성 후 Instagram에 게시.
 */

import type { StravaActivitySummary } from '@/lib/strava-api';
import {
  getValidAccessToken,
  fetchActivitiesByDate,
  buildStravaInstagramCaption,
} from '@/lib/strava-api';
import { generateInstagramCard } from '@/lib/instagram-image';
import { pickedPhotos, runningRecords, userTokens } from '@/lib/db-supabase';
import { uploadPublicJpegWithFallback } from '@/lib/blob-storage';
import { publishPublicImageToInstagramForUser } from '@/lib/instagram-user-publish';

function syntheticActivitiesFromRecord(record: {
  title: string | null;
  record_date: string;
  distance: number | null;
  duration: number | null;
  burned_calories: number | null;
}): StravaActivitySummary[] {
  const title = record.title?.trim() || 'Activity';
  return [
    {
      activityId: 0,
      activityName: title,
      sportType: 'Run',
      startTimeLocal: `${record.record_date}T12:00:00`,
      distanceKm: Number(record.distance ?? 0) || 0,
      durationMinutes: Number(record.duration ?? 0) || 0,
      calories: Number(record.burned_calories ?? 0) || 0,
      averageHR: 0,
      maxHR: 0,
      elevationGain: 0,
      averagePaceMinPerKm: null,
      locationName: '',
    },
  ];
}

async function loadActivitiesForRecord(
  userId: number,
  record: {
    record_date: string;
    title: string | null;
    distance: number | null;
    duration: number | null;
    burned_calories: number | null;
  }
): Promise<{ activities: StravaActivitySummary[]; source: 'strava' | 'synthetic' }> {
  const stravaToken = await userTokens.findByProvider(userId, 'strava');
  if (!stravaToken?.refresh_token) {
    return {
      activities: syntheticActivitiesFromRecord(record),
      source: 'synthetic',
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
  }

  const activities = await fetchActivitiesByDate(
    valid.access_token,
    record.record_date
  );
  if (activities.length > 0) {
    return { activities, source: 'strava' };
  }
  return {
    activities: syntheticActivitiesFromRecord(record),
    source: 'synthetic',
  };
}

async function fetchImageUrlToBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

export type PublishExistingRecordResult = {
  ok: boolean;
  error?: string;
  igMediaId?: string | null;
  log?: string[];
};

export async function publishExistingRecordToInstagram(
  userId: number,
  recordId: number
): Promise<PublishExistingRecordResult> {
  const log: string[] = [];
  const record = await runningRecords.findById(recordId, userId);
  if (!record) {
    return { ok: false, error: '기록을 찾을 수 없습니다.' };
  }
  if (record.user_id !== userId) {
    return { ok: false, error: '권한이 없습니다.' };
  }

  let photoBuffer: Buffer | null = null;
  if (record.image_url?.trim()) {
    photoBuffer = await fetchImageUrlToBuffer(record.image_url.trim());
    if (photoBuffer?.length) {
      log.push('배경: RunLog에 저장된 이미지 URL');
    } else {
      log.push(
        '배경: 저장된 URL을 불러오지 못함(404·만료 등) — Picker 또는 기본 배경으로 대체'
      );
    }
  }

  if (!photoBuffer?.length) {
    const picked = await pickedPhotos.findByDate(userId, record.record_date);
    if (picked?.blob_url?.trim()) {
      photoBuffer = await fetchImageUrlToBuffer(picked.blob_url.trim());
      if (photoBuffer?.length) {
        log.push('배경: 해당 날짜 Google Photos Picker에 저장된 이미지');
      } else {
        log.push('배경: Picker URL도 불러오지 못함 — 기본 그라데이션 사용');
      }
    } else if (!record.image_url?.trim()) {
      log.push('배경: 이미지 URL 없음 — 기본 그라데이션 사용');
    } else {
      log.push('배경: 대체 이미지 없음 — 기본 그라데이션 사용');
    }
  }

  const { activities, source } = await loadActivitiesForRecord(userId, {
    record_date: record.record_date,
    title: record.title,
    distance: record.distance,
    duration: record.duration,
    burned_calories: record.burned_calories,
  });
  log.push(
    source === 'strava'
      ? `Strava 활동 ${activities.length}건으로 카드 생성`
      : '해당일 Strava 활동 없음 — 저장된 기록 수치로 카드 생성'
  );

  let cardBuffer: Buffer;
  try {
    cardBuffer = await generateInstagramCard(activities, photoBuffer ?? null);
  } catch (e) {
    return {
      ok: false,
      error: `카드 생성 실패: ${e instanceof Error ? e.message : String(e)}`,
    };
  }

  const uploaded = await uploadPublicJpegWithFallback(cardBuffer, 'records');
  if (!uploaded.ok) {
    return {
      ok: false,
      error: `카드 이미지 업로드 실패: ${uploaded.error}`,
    };
  }
  if (uploaded.storage === 'supabase') {
    log.push('카드: Supabase Storage 업로드 (Blob 폴백)');
  }
  const cardUrl = uploaded.url;

  const caption = buildStravaInstagramCaption(activities, record.record_date);
  const { igMediaId, log: pubLog } = await publishPublicImageToInstagramForUser(
    userId,
    cardUrl,
    caption
  );

  return {
    ok: true,
    igMediaId,
    log: [...log, ...pubLog],
  };
}
