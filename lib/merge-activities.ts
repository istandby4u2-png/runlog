/**
 * Garmin 활동과 아이폰 단축어(Apple 건강) ingest를 합칠 때 소스 간 중복 제거.
 *
 * 배경: 사용자가 애플워치로 한 운동이 Garmin Connect(→ Garmin 조회)와
 * Apple 건강(→ 단축어 ingest) 양쪽에 다 들어오는 경우, 두 소스를 단순히 이어붙이면
 * 같은 운동이 2번 집계된다(예: 하루 3건이 6건으로). 같은 종목 + 시작 시각이
 * 가까우면 동일 운동으로 보고 하나만 남긴다.
 */

import type { StravaActivitySummary } from '@/lib/strava-api';

/**
 * startTimeLocal에서 KST 벽시계 "분(0~1439)"만 추출.
 * Garmin은 "2026-07-31 08:21:00"(TZ 없음), 단축어는 "2026-07-31 08:21:02 +0900"처럼
 * 표기가 달라 절대시각 파싱이 어긋날 수 있어, 문자열의 시:분을 그대로 비교한다.
 */
function localMinuteOfDay(s: string): number | null {
  const m = (s || '').match(/(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

const DUP_WINDOW_MIN = 10;
/** 묶음 활동 판정 시 앞뒤로 허용할 여유 (분) */
const CONTAINER_EDGE_MIN = 10;

/**
 * Garmin의 «묶음» 활동(マルチスポーツ 등)인지 판정.
 *
 * Garmin은 러닝→워킹처럼 이어서 한 세션을 멀티스포츠 하나로 올리는데, Apple
 * 건강은 같은 세션을 종목별로 쪼개 보낸다. 종목명이 달라(Workout vs Run/Walk)
 * 종목 기준 중복 제거에 걸리지 않아 거리·시간이 이중 집계됐다
 * (2026-08-27: ラン 10.26km + ウォーク 2.1km 와 マルチスポーツ 12.36km 가 동시 집계).
 *
 * 시간 창 안에 들어오는 ingest 활동들의 거리·시간 합이 이 활동과 일치하면
 * 같은 세션을 묶어 놓은 것으로 보고 Garmin 쪽을 버린다(종목별로 쪼갠
 * Apple 값이 사용자가 보는 값과 일치하므로 그쪽을 남긴다).
 */
function wrapsIngestedActivities(
  g: StravaActivitySummary,
  ingested: StravaActivitySummary[]
): boolean {
  const gStart = localMinuteOfDay(g.startTimeLocal || '');
  if (gStart == null || g.durationMinutes <= 0) return false;
  const gEnd = gStart + g.durationMinutes;

  const inside = ingested.filter((i) => {
    const s = localMinuteOfDay(i.startTimeLocal || '');
    if (s == null) return false;
    const e = s + Math.max(0, i.durationMinutes);
    return s >= gStart - CONTAINER_EDGE_MIN && e <= gEnd + CONTAINER_EDGE_MIN;
  });
  if (inside.length < 2) return false;

  const sumDur = inside.reduce((n, i) => n + (i.durationMinutes || 0), 0);
  const sumDist = inside.reduce((n, i) => n + (i.distanceKm || 0), 0);
  const durOk =
    Math.abs(sumDur - g.durationMinutes) <= Math.max(5, g.durationMinutes * 0.1);
  const distOk =
    Math.abs(sumDist - g.distanceKm) <= Math.max(0.5, g.distanceKm * 0.05);
  return durOk && distOk;
}

/**
 * Garmin + 단축어(Apple 건강)를 합치되 중복 제거. 같은 종목이고 시작 시각이
 * ±10분 이내면 같은 운동으로 보고 **단축어(Apple 건강) 값을 정본**으로 남긴다
 * (사용자가 Apple 피트니스로 확인하는 값과 일치). Garmin에만 있는 운동은
 * 그대로 포함해 커버리지를 유지한다. 최신순 정렬로 반환.
 */
export function mergeGarminAndIngested(
  garmin: StravaActivitySummary[],
  ingested: StravaActivitySummary[]
): StravaActivitySummary[] {
  const isDupOfIngested = (g: StravaActivitySummary): boolean => {
    // 1) 같은 종목 + 시작 시각이 가까우면 같은 운동
    const sameActivity = ingested.some((i) => {
      if (i.sportType !== g.sportType) return false;
      const gi = localMinuteOfDay(g.startTimeLocal || '');
      const ii = localMinuteOfDay(i.startTimeLocal || '');
      if (gi == null || ii == null) return false;
      return Math.abs(gi - ii) <= DUP_WINDOW_MIN;
    });
    if (sameActivity) return true;
    // 2) 여러 ingest 활동을 하나로 묶은 Garmin 활동(멀티스포츠 등)
    return wrapsIngestedActivities(g, ingested);
  };

  const garminOnly = garmin.filter((g) => !isDupOfIngested(g));
  return [...garminOnly, ...ingested].sort((a, b) =>
    (b.startTimeLocal || '').localeCompare(a.startTimeLocal || '')
  );
}
