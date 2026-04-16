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
import { runningRecords, userTokens } from '@/lib/db-supabase';
import { uploadImageDetailed } from '@/lib/blob-storage';
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
  if (!record.image_url) {
    return {
      ok: false,
      error: '이미지(URL)가 없어 카드를 만들 수 없습니다.',
    };
  }

  let photoBuffer: Buffer;
  try {
    const res = await fetch(record.image_url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    photoBuffer = Buffer.from(await res.arrayBuffer());
  } catch (e) {
    return {
      ok: false,
      error: `배경 이미지를 불러오지 못했습니다: ${e instanceof Error ? e.message : String(e)}`,
    };
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
    cardBuffer = await generateInstagramCard(activities, photoBuffer);
  } catch (e) {
    return {
      ok: false,
      error: `카드 생성 실패: ${e instanceof Error ? e.message : String(e)}`,
    };
  }

  const uploaded = await uploadImageDetailed(cardBuffer, 'records');
  if (!uploaded.ok) {
    return {
      ok: false,
      error: `카드 이미지 업로드 실패: ${uploaded.error}`,
    };
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
