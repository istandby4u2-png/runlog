/**
 * 늦게 도착한 운동을 이미 만들어진 사이트 기록에 반영.
 *
 * 배경: daily-sync 크론은 하루 두 번(21:00·22:30 KST)만 돌고, «그 날짜 기록이
 * 이미 있으면 통째로 건너뛴다». 애플워치 운동은 아이폰 단축어가 비동기로 보내므로
 * (폰 잠금·자동화 지연) 기록 생성 이후에 도착하는 운동은 사이트에 반영되지 못했다.
 * 사진에 이미 있는 «늦게 도착하면 자동 반영»과 대칭으로, ingest 시점에 이 함수를
 * 호출해 그 날짜의 전체 운동(Garmin + 단축어)으로 기록을 다시 계산한다.
 *
 * 기록이 없으면 아무것도 하지 않는다 — 최초 생성과 Instagram 게시는 daily-sync
 * 크론이 담당하며, ingest가 먼저 기록을 만들면 크론이 «이미 있음»으로 건너뛰어
 * IG 게시가 누락되기 때문이다. 배경 사진·공개 설정은 그대로 두고 운동 관련
 * 필드(제목·본문·거리·시간·소모칼로리)만 갱신한다.
 */

import type { StravaActivitySummary } from '@/lib/strava-api';
import {
  sumActivitiesMetrics,
  buildStravaRecordContent,
  stravaSyncRecordTitle,
} from '@/lib/strava-api';
import { fetchDayActivitySummaries } from '@/lib/garmin-api';
import { loadIngestedWorkouts } from '@/lib/ingested-workouts';
import { runningRecords } from '@/lib/db-supabase';

export type RefreshRecordResult = {
  updated: boolean;
  recordId: number | null;
  /** 갱신을 건너뛴 이유 (있을 때) */
  reason?: 'no_record' | 'no_activities';
  activityCount?: number;
};

export async function refreshRecordFromWorkouts(
  userId: number,
  dateStr: string
): Promise<RefreshRecordResult> {
  const recordId = await runningRecords.findIdByUserAndRecordDate(userId, dateStr);
  if (recordId == null) {
    // 아직 기록 없음 — 생성·IG 게시는 daily-sync 크론에 맡긴다.
    return { updated: false, recordId: null, reason: 'no_record' };
  }

  // daily-sync와 동일하게 Garmin 활동 + 단축어 ingest를 합친다.
  let activities: StravaActivitySummary[] = [];
  try {
    activities = await fetchDayActivitySummaries(dateStr);
  } catch {
    // Garmin 실패해도 ingest 운동만으로 갱신 진행
  }
  try {
    const ingested = await loadIngestedWorkouts(userId, dateStr);
    if (ingested.length > 0) activities = [...activities, ...ingested];
  } catch {
    // ingest 로드 실패는 무시 (Garmin만으로라도 갱신)
  }
  activities.sort((a, b) =>
    (b.startTimeLocal || '').localeCompare(a.startTimeLocal || '')
  );
  if (activities.length === 0) {
    return { updated: false, recordId, reason: 'no_activities' };
  }

  const sums = sumActivitiesMetrics(activities);
  await runningRecords.update(recordId, {
    title: stravaSyncRecordTitle(activities, dateStr),
    content: buildStravaRecordContent(activities),
    distance: sums.totalDistanceKm > 0 ? sums.totalDistanceKm : null,
    duration: sums.totalDurationMinutes > 0 ? sums.totalDurationMinutes : null,
    burned_calories: sums.totalCalories > 0 ? sums.totalCalories : null,
  });
  return { updated: true, recordId, activityCount: activities.length };
}
