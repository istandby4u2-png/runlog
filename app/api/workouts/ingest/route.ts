import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import type { StravaActivitySummary } from '@/lib/strava-api';
import { saveIngestedWorkouts } from '@/lib/ingested-workouts';
import { extractWorkoutsFromImage, type ExtractedWorkout } from '@/lib/gemini';

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

/** Apple Health 운동 종류(한/영/일) → Strava sport_type 호환 문자열 */
function appleTypeToSportType(raw: string): string {
  const t = (raw || '').toLowerCase();
  if (
    t.includes('run') || t.includes('달리기') || t.includes('러닝') ||
    t.includes('ラン') || t.includes('走')
  )
    return 'Run';
  if (
    t.includes('hik') || t.includes('등산') || t.includes('하이킹') ||
    t.includes('ハイキング') || t.includes('登山')
  )
    return 'Hike';
  if (
    t.includes('walk') || t.includes('걷기') || t.includes('워킹') ||
    t.includes('ウォーク') || t.includes('ウォーキング') || t.includes('歩')
  )
    return 'Walk';
  if (
    t.includes('cycl') || t.includes('bike') || t.includes('자전거') || t.includes('사이클') ||
    t.includes('サイクリング') || t.includes('バイク') || t.includes('自転車')
  )
    return 'Ride';
  if (
    t.includes('strength') || t.includes('근력') || t.includes('웨이트') || t.includes('헬스') ||
    t.includes('筋力') || t.includes('筋トレ') || t.includes('ストレングス')
  )
    return 'WeightTraining';
  if (t.includes('swim') || t.includes('수영') || t.includes('水泳') || t.includes('スイミング'))
    return 'Swim';
  if (
    t.includes('stepper') || t.includes('stair') || t.includes('스테퍼') || t.includes('스텝퍼') ||
    t.includes('계단') || t.includes('ステッパー')
  )
    return 'StairStepper';
  return 'Workout';
}

function toNumber(v: number | string | undefined): number {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = parseFloat(v.replace(/,/g, '').replace(/[^\d.-]/g, ''));
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

/**
 * 단축어가 보내는 다양한 지속 시간 표기를 분으로 변환:
 * "58", 58, "58분", "1시간 5분", "1:05:24"(h:m:s), "58:24"(m:s), "3480초"
 */
function parseDurationMinutes(v: number | string | undefined): number {
  if (typeof v === 'number' && Number.isFinite(v)) return Math.round(v);
  if (typeof v !== 'string') return 0;
  const s = v.trim();

  const colon = s.match(/^(\d+):(\d{1,2})(?::(\d{1,2}))?$/);
  if (colon) {
    const [, a, b, c] = colon;
    return c !== undefined
      ? Math.round(parseInt(a) * 60 + parseInt(b) + parseInt(c) / 60)
      : Math.round(parseInt(a) + parseInt(b) / 60);
  }

  const hm = s.match(/(\d+)\s*시간(?:\s*(\d+)\s*분)?/);
  if (hm) return parseInt(hm[1]) * 60 + (hm[2] ? parseInt(hm[2]) : 0);

  if (/초|sec/i.test(s)) return Math.round(toNumber(s) / 60);
  if (/시간|hour|hr/i.test(s)) return Math.round(toNumber(s) * 60);
  return Math.round(toNumber(s));
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

/** Health Auto Export 앱의 운동 항목 (버전에 따라 필드가 조금씩 다름 — 관용적으로 처리) */
type HaeQty = { qty?: number; units?: string } | number | undefined;
type HaeWorkout = {
  name?: string;
  start?: string;
  end?: string;
  /** 초 또는 분 (버전에 따라 다름) */
  duration?: number | string;
  distance?: HaeQty;
  activeEnergy?: HaeQty;
  activeEnergyBurned?: HaeQty;
};

function haeQtyValue(q: HaeQty): { qty: number; units: string } | null {
  if (typeof q === 'number') return { qty: q, units: '' };
  if (q && typeof q === 'object' && typeof q.qty === 'number') {
    return { qty: q.qty, units: (q.units || '').toLowerCase() };
  }
  return null;
}

function haeToIncoming(w: HaeWorkout): IncomingWorkout {
  let distanceKm: number | undefined;
  const dist = haeQtyValue(w.distance);
  if (dist) {
    distanceKm = dist.units === 'm' ? dist.qty / 1000 : dist.units === 'mi' ? dist.qty * 1.60934 : dist.qty;
  }

  let durationMinutes: number | undefined;
  if (w.duration !== undefined) {
    const n = typeof w.duration === 'number' ? w.duration : parseFloat(String(w.duration));
    if (Number.isFinite(n)) {
      // 600 초과면 초 단위로 간주 (10시간 넘는 운동은 없다고 가정)
      durationMinutes = n > 600 ? Math.round(n / 60) : Math.round(n);
    }
  }
  if (durationMinutes === undefined && w.start && w.end) {
    const ms = new Date(w.end).getTime() - new Date(w.start).getTime();
    if (Number.isFinite(ms) && ms > 0) durationMinutes = Math.round(ms / 60000);
  }

  const energy = haeQtyValue(w.activeEnergy) ?? haeQtyValue(w.activeEnergyBurned);
  let calories: number | undefined;
  if (energy) {
    // HAE는 에너지를 kJ로 보내는 경우가 있음 (2096kJ = 500kcal)
    calories = energy.units.includes('kj')
      ? Math.round(energy.qty / 4.184)
      : Math.round(energy.qty);
  }

  return {
    start: w.start,
    type: w.name,
    distanceKm,
    durationMinutes,
    calories,
  };
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

  let incoming: IncomingWorkout[] = [];
  let parsedFromImage: ExtractedWorkout[] | undefined;

  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('multipart/form-data')) {
    // 피트니스 앱 공유 이미지(운동 요약 카드·스크린샷) → Gemini Vision 판독
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return NextResponse.json(
        { error: 'multipart 파싱 실패' },
        { status: 400 }
      );
    }
    const dateField = form.get('date');
    const defaultDate =
      typeof dateField === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateField)
        ? dateField
        : new Date(
            new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' })
          ).toISOString().slice(0, 10);

    const files = [...form.entries()]
      .map(([, v]) => v)
      .filter((v): v is File => v instanceof File && v.type.startsWith('image/'));
    if (files.length === 0) {
      return NextResponse.json(
        { error: '운동 요약 이미지가 없습니다. 피트니스 앱 공유 이미지를 첨부해 주세요.' },
        { status: 400 }
      );
    }

    parsedFromImage = [];
    for (const file of files.slice(0, 5)) {
      const extracted = await extractWorkoutsFromImage({
        buffer: Buffer.from(await file.arrayBuffer()),
        mimeType: file.type,
      });
      if (!extracted || extracted.length === 0) continue;
      parsedFromImage.push(...extracted);
      for (const w of extracted) {
        const date =
          w.date && /^\d{4}-\d{2}-\d{2}$/.test(w.date) ? w.date : defaultDate;
        // 같은 운동 재공유는 같은 시각(=같은 id)이 되도록 내용 기반 시각 생성
        const key = `${w.type}|${w.distanceKm}|${w.durationMinutes}|${w.calories}`;
        let hash = 0;
        for (const ch of key) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
        const minutes = hash % 600; // 10:00 ~ 19:59 사이
        const hh = String(10 + Math.floor(minutes / 60)).padStart(2, '0');
        const mm = String(minutes % 60).padStart(2, '0');
        incoming.push({
          start: `${date} ${hh}:${mm}:00`,
          type: w.type,
          distanceKm: w.distanceKm ?? undefined,
          durationMinutes: w.durationMinutes ?? undefined,
          calories: w.calories ?? undefined,
        });
      }
    }
    if (incoming.length === 0) {
      return NextResponse.json(
        { error: '이미지에서 운동 정보를 읽지 못했습니다. 운동 요약이 잘 보이는 이미지인지 확인해 주세요.' },
        { status: 422 }
      );
    }
  } else {
    let body: {
      workouts?: IncomingWorkout[];
      /** Health Auto Export 앱 형식: { data: { workouts: [...] } } */
      data?: { workouts?: HaeWorkout[] };
    } & IncomingWorkout;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'JSON body가 필요합니다: 운동 1건 {start,type,...} 또는 { "workouts": [...] }' },
        { status: 400 }
      );
    }
    // 허용 형태: {data:{workouts:[...]}} (HAE) / {workouts:[...]} / [ ... ] / 단건 객체
    let rawItems: unknown[] = [];
    if (Array.isArray(body)) {
      rawItems = body;
    } else if (Array.isArray(body.data?.workouts)) {
      rawItems = body.data.workouts;
    } else if (Array.isArray(body.workouts)) {
      rawItems = body.workouts;
    } else if (body.start || body.name) {
      rawItems = [body];
    }

    incoming = rawItems
      .filter((it): it is Record<string, unknown> => !!it && typeof it === 'object')
      .map((it) => {
        // HAE류 항목 판별: qty 객체 필드나 duration/name(HAE는 type 대신 name) 사용
        const hae =
          typeof it.distance === 'object' ||
          typeof it.activeEnergy === 'object' ||
          typeof it.activeEnergyBurned === 'object' ||
          ('duration' in it && !('durationMinutes' in it));
        return hae
          ? haeToIncoming(it as HaeWorkout)
          : (it as IncomingWorkout);
      });
  }
  if (incoming.length === 0) {
    return NextResponse.json(
      { error: 'workouts 배열 또는 start 필드가 필요합니다.' },
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
    const durationMinutes = parseDurationMinutes(w.durationMinutes);
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
    const merged = await saveIngestedWorkouts(userId, dateStr, list);
    saved[dateStr] = merged.length;
  }

  return NextResponse.json({
    ok: true,
    saved,
    parsed: parsedFromImage,
    skipped: skipped.length > 0 ? skipped : undefined,
  });
}
