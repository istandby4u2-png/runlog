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
  const isDupOfIngested = (g: StravaActivitySummary): boolean =>
    ingested.some((i) => {
      if (i.sportType !== g.sportType) return false;
      const gi = localMinuteOfDay(g.startTimeLocal || '');
      const ii = localMinuteOfDay(i.startTimeLocal || '');
      if (gi == null || ii == null) return false;
      return Math.abs(gi - ii) <= DUP_WINDOW_MIN;
    });

  const garminOnly = garmin.filter((g) => !isDupOfIngested(g));
  return [...garminOnly, ...ingested].sort((a, b) =>
    (b.startTimeLocal || '').localeCompare(a.startTimeLocal || '')
  );
}
