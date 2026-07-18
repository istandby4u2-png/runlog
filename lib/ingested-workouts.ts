/**
 * iPhone 단축어가 전송한 애플워치(Apple Health) 운동 데이터 저장/조회.
 *
 * 2026-07-09부터 사용자가 Garmin 워치 → Apple Watch로 전환. Apple Health는
 * 서버 API가 없어 iPhone 단축어가 매일 운동 데이터를 POST하고(/api/workouts/ingest),
 * daily-sync가 Garmin 활동과 합쳐 기록을 만든다.
 *
 * 저장소: Supabase Storage 비공개 버킷(runlog-data)에 날짜별 JSON
 * (DB 마이그레이션 없이 동작; service role로만 접근).
 */

import { supabaseAdmin } from '@/lib/supabase';
import type { StravaActivitySummary } from '@/lib/strava-api';

const BUCKET = 'runlog-data';

async function ensureBucket(): Promise<void> {
  if (!supabaseAdmin) throw new Error('Supabase admin client not initialized');
  const { error } = await supabaseAdmin.storage.getBucket(BUCKET);
  if (error) {
    await supabaseAdmin.storage.createBucket(BUCKET, { public: false });
  }
}

function pathFor(userId: number, dateStr: string): string {
  return `workouts/${userId}/${dateStr}.json`;
}

/**
 * 해당 날짜에 운동을 병합 저장. activityId(시작 시각 epoch) 기준으로 대체하므로
 * 단축어가 1건씩 여러 번 보내도, 같은 날짜를 재전송해도 중복이 생기지 않는다.
 */
export async function saveIngestedWorkouts(
  userId: number,
  dateStr: string,
  workouts: StravaActivitySummary[]
): Promise<StravaActivitySummary[]> {
  if (!supabaseAdmin) throw new Error('Supabase admin client not initialized');
  await ensureBucket();

  const existing = await loadIngestedWorkouts(userId, dateStr);
  const byId = new Map<number, StravaActivitySummary>();
  for (const w of existing) byId.set(w.activityId, w);

  for (const w of workouts) {
    // 같은 운동이 다른 경로(이미지 공유 vs HAE)로 들어온 경우 대체:
    // 종목 동일 + 시간 ±3분 + 거리 ±0.5km면 같은 운동으로 판단
    for (const [id, ex] of byId) {
      if (
        id !== w.activityId &&
        ex.sportType === w.sportType &&
        Math.abs(ex.durationMinutes - w.durationMinutes) <= 3 &&
        Math.abs(ex.distanceKm - w.distanceKm) <= 0.5
      ) {
        byId.delete(id);
      }
    }
    byId.set(w.activityId, w);
  }

  const merged = [...byId.values()].sort((a, b) =>
    (b.startTimeLocal || '').localeCompare(a.startTimeLocal || '')
  );

  const body = Buffer.from(JSON.stringify(merged, null, 2));
  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(pathFor(userId, dateStr), body, {
      contentType: 'application/json',
      upsert: true,
    });
  if (error) {
    throw new Error(`ingested workouts 저장 실패: ${error.message}`);
  }
  return merged;
}

/** 해당 날짜에 단축어로 전송된 운동 목록 (없으면 빈 배열). */
export async function loadIngestedWorkouts(
  userId: number,
  dateStr: string
): Promise<StravaActivitySummary[]> {
  if (!supabaseAdmin) return [];
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .download(pathFor(userId, dateStr));
  if (error || !data) return [];
  try {
    const parsed = JSON.parse(await data.text()) as StravaActivitySummary[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
