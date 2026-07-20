/**
 * 이미 RunLog에 있는 기록을 활동 데이터(Garmin·애플워치)·DB로 카드 생성 후 Instagram에 게시.
 */

import type { StravaActivitySummary } from '@/lib/strava-api';
import { buildStravaInstagramCaption } from '@/lib/strava-api';
import { fetchDayActivitySummaries } from '@/lib/garmin-api';
import { loadIngestedWorkouts } from '@/lib/ingested-workouts';
import { generateInstagramCard } from '@/lib/instagram-image';
import { pickedPhotos, runningRecords } from '@/lib/db-supabase';
import { uploadPublicJpegWithFallback } from '@/lib/blob-storage';
import { publishPublicImageToInstagramForUser } from '@/lib/instagram-user-publish';

/** 기록 제목(한/영/일)에서 종목 추론 — Garmin·단축어 데이터가 없어 기록 수치로 카드 만들 때 */
function inferSportTypeFromName(raw: string): string {
  const t = (raw || '').toLowerCase();
  if (t.includes('swim') || t.includes('수영') || t.includes('水泳') || t.includes('スイミング'))
    return 'Swim';
  if (t.includes('stepper') || t.includes('stair') || t.includes('스테퍼') || t.includes('ステッパー'))
    return 'StairStepper';
  if (t.includes('cycl') || t.includes('bike') || t.includes('자전거') || t.includes('사이클') ||
      t.includes('サイクリング') || t.includes('バイク') || t.includes('自転車'))
    return 'Ride';
  if (t.includes('walk') || t.includes('걷기') || t.includes('ウォーク') || t.includes('歩'))
    return 'Walk';
  if (t.includes('hik') || t.includes('등산') || t.includes('ハイキング') || t.includes('登山'))
    return 'Hike';
  if (t.includes('strength') || t.includes('근력') || t.includes('웨이트') ||
      t.includes('筋力') || t.includes('筋トレ'))
    return 'WeightTraining';
  return 'Run';
}

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
      sportType: inferSportTypeFromName(title),
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
): Promise<{ activities: StravaActivitySummary[]; source: 'activity' | 'synthetic' }> {
  let activities: StravaActivitySummary[] = [];
  try {
    activities = await fetchDayActivitySummaries(record.record_date);
  } catch {
    // Garmin 조회 실패는 무시 — 단축어 전송분·기록 수치로 대체
  }
  try {
    const ingested = await loadIngestedWorkouts(userId, record.record_date);
    if (ingested.length > 0) {
      activities = [...activities, ...ingested].sort((a, b) =>
        (b.startTimeLocal || '').localeCompare(a.startTimeLocal || '')
      );
    }
  } catch {
    // ignore
  }

  if (activities.length > 0) {
    return { activities, source: 'activity' };
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
    source === 'activity'
      ? `활동 데이터 ${activities.length}건으로 카드 생성 (Garmin·애플워치)`
      : '해당일 활동 데이터 없음 — 저장된 기록 수치로 카드 생성'
  );

  let cardBuffer: Buffer;
  try {
    cardBuffer = await generateInstagramCard(
      activities,
      photoBuffer ?? null,
      record.record_date
    );
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
