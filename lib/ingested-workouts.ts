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

/** 해당 날짜의 운동 목록 전체를 저장 (같은 날짜 재전송 시 덮어씀 → 멱등). */
export async function saveIngestedWorkouts(
  userId: number,
  dateStr: string,
  workouts: StravaActivitySummary[]
): Promise<void> {
  if (!supabaseAdmin) throw new Error('Supabase admin client not initialized');
  await ensureBucket();
  const body = Buffer.from(JSON.stringify(workouts, null, 2));
  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(pathFor(userId, dateStr), body, {
      contentType: 'application/json',
      upsert: true,
    });
  if (error) {
    throw new Error(`ingested workouts 저장 실패: ${error.message}`);
  }
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
