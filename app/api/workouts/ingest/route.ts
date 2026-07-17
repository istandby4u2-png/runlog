import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import type { StravaActivitySummary } from '@/lib/strava-api';
import { saveIngestedWorkouts } from '@/lib/ingested-workouts';

const AUTO_SYNC_USER_ID = parseInt(process.env.AUTO_SYNC_USER_ID || '0', 10);
const CRON_SECRET = process.env.CRON_SECRET;

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/** 단축어(건강 샘플)나 사람이 보내는 느슨한 운동 항목 */
type IncomingWorkout = {
  /** 시작 시각 — ISO 또는 단축어의 날짜 문자열 */
  start?: string;
  /** 운동 종류 — 한글/영문 자유 표기 (달리기, Running, 실외 사이클링 …) */
  type?: string;
  name?: string;
  distanceKm?: number | string;
  durationMinutes?: number | string;
  calories?: number | string;
  averageHR?: number | string;
};

/** Apple Health 운동 종류(한/영) → Strava sport_type 호환 문자열 */
function appleTypeToSportType(raw: string): string {
  const t = (raw || '').toLowerCase();
  if (t.includes('run') || t.includes('달리기') || t.includes('러닝')) return 'Run';
  if (t.includes('hik') || t.includes('등산') || t.includes('하이킹')) return 'Hike';
  if (t.includes('walk') || t.includes('걷기') || t.includes('워킹')) return 'Walk';
  if (t.includes('cycl') || t.includes('bike') || t.includes('자전거') || t.includes('사이클'))
    return 'Ride';
  if (t.includes('strength') || t.includes('근력') || t.includes('웨이트') || t.includes('헬스'))
    return 'WeightTraining';
  return 'Workout';
}

function toNumber(v: number | string | undefined): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = parseFloat(v.replace(/[^\d.-]/g, ''));
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

/** 시작 시각 → KST 달력 날짜 (단축어의 로컬 ISO는 그대로, UTC 표기는 KST 변환) */
function startToKstDate(start: string): string | null {
  const d = new Date(start);
  if (Number.isNaN(d.getTime())) return null;
  const hasTz = /[zZ]|[+-]\d{2}:?\d{2}$/.test(start.trim());
  if (!hasTz) return start.trim().slice(0, 10);
  // 서버 타임존과 무관하게 KST 달력 날짜 산출
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

/**
 * POST /api/workouts/ingest
 *
 * iPhone 단축어가 Apple Health의 운동 샘플들을 JSON으로 전송하면
 * 날짜별로 저장하고, daily-sync가 Garmin 활동과 합쳐 사용합니다.
 * 같은 날짜를 다시 보내면 그 날짜 전체가 대체됩니다 (멱등).
 *
 * body: { "workouts": [ { start, type, name?, distanceKm?, durationMinutes?, calories?, averageHR? } ] }
 */
export async function POST(request: NextRequest) {
  const bearerOk =
    !!CRON_SECRET &&
    request.headers.get('authorization') === `Bearer ${CRON_SECRET}`;
  const sessionUserId = getUserIdFromRequest();

  let userId: number;
  if (bearerOk) {
    if (!AUTO_SYNC_USER_ID) {
      return NextResponse.json(
        { error: 'AUTO_SYNC_USER_ID not configured' },
        { status: 500 }
      );
    }
    userId = AUTO_SYNC_USER_ID;
  } else if (sessionUserId) {
    userId = sessionUserId;
  } else {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { workouts?: IncomingWorkout[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'JSON body가 필요합니다: { "workouts": [...] }' },
      { status: 400 }
    );
  }
  const incoming = Array.isArray(body.workouts) ? body.workouts : [];
  if (incoming.length === 0) {
    return NextResponse.json(
      { error: 'workouts 배열이 비어 있습니다.' },
      { status: 400 }
    );
  }

  const byDate = new Map<string, StravaActivitySummary[]>();
  const skipped: string[] = [];

  for (const w of incoming) {
    const start = (w.start || '').trim();
    const dateStr = start ? startToKstDate(start) : null;
    if (!dateStr) {
      skipped.push(`start 누락/파싱 실패: ${JSON.stringify(w).slice(0, 80)}`);
      continue;
    }
    const distanceKm = Math.round(toNumber(w.distanceKm) * 100) / 100;
    const durationMinutes = Math.round(toNumber(w.durationMinutes));
    const sportType = appleTypeToSportType(w.type || w.name || '');
    const summary: StravaActivitySummary = {
      activityId: new Date(start).getTime(),
      activityName: (w.name || w.type || 'Workout').trim(),
      sportType,
      startTimeLocal: start,
      distanceKm,
      durationMinutes,
      calories: Math.round(toNumber(w.calories)),
      averageHR: Math.round(toNumber(w.averageHR)),
      maxHR: 0,
      elevationGain: 0,
      averagePaceMinPerKm:
        distanceKm > 0 && durationMinutes > 0
          ? Math.round((durationMinutes / distanceKm) * 100) / 100
          : null,
      locationName: '',
    };
    const list = byDate.get(dateStr) || [];
    list.push(summary);
    byDate.set(dateStr, list);
  }

  const saved: Record<string, number> = {};
  for (const [dateStr, list] of byDate) {
    list.sort((a, b) => (b.startTimeLocal || '').localeCompare(a.startTimeLocal || ''));
    await saveIngestedWorkouts(userId, dateStr, list);
    saved[dateStr] = list.length;
  }

  return NextResponse.json({
    ok: true,
    saved,
    skipped: skipped.length > 0 ? skipped : undefined,
  });
}
