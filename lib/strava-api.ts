/**
 * Strava API v3 integration.
 *
 * OAuth flow:
 *   1. Redirect user to Strava authorization page
 *   2. Exchange code for access_token + refresh_token
 *   3. Store tokens in user_tokens table (provider: 'strava')
 *   4. Refresh access_token when expired (every 6 hours)
 *
 * @see https://developers.strava.com/docs/reference/
 */

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID || '';
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET || '';
const STRAVA_REDIRECT_URI =
  process.env.STRAVA_REDIRECT_URI || 'https://runlog.life/api/oauth/strava/callback';

export interface StravaActivity {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  /** UTC, list/detail 응답에 포함 */
  start_date?: string;
  start_date_local: string;
  distance: number;       // meters
  moving_time: number;    // seconds
  elapsed_time: number;   // seconds
  total_elevation_gain: number;
  average_speed: number;  // m/s
  max_speed: number;
  average_heartrate?: number;
  max_heartrate?: number;
  calories?: number;
  has_heartrate: boolean;
}

export interface StravaActivitySummary {
  activityId: number;
  activityName: string;
  /** Strava `sport_type` (권장) 또는 `type` — Run, Walk, Ride, WeightTraining 등 */
  sportType: string;
  startTimeLocal: string;
  distanceKm: number;
  durationMinutes: number;
  calories: number;
  averageHR: number;
  maxHR: number;
  elevationGain: number;
  averagePaceMinPerKm: number | null;
  locationName: string;
}

/** Strava activity start as calendar YYYY-MM-DD in Asia/Seoul (앱의 KST 날짜 기준 테스트용). */
export function activityKstCalendarDate(a: StravaActivity): string {
  if (a.start_date) {
    return new Date(
      new Date(a.start_date).toLocaleString('en-US', { timeZone: 'Asia/Seoul' })
    ).toISOString().slice(0, 10);
  }
  if (typeof a.start_date_local === 'string' && a.start_date_local.length >= 10) {
    return a.start_date_local.slice(0, 10);
  }
  return '';
}

/** Instagram 카드 등에 쓰는 Strava 종목 → 이모지 (영문·한글 표기 모두) */
export function stravaSportTypeEmoji(sportType: string): string {
  const raw = (sportType || 'Run').trim();
  const key = raw.replace(/\s+/g, '').toLowerCase();

  const walk = new Set(['walk', 'hike']);
  const run = new Set(['run', 'trailrun', 'virtualrun', 'track']);
  const bike = new Set([
    'ride',
    'virtualride',
    'ebikeride',
    'emountainbikeride',
    'mountainbikeride',
    'gravelride',
    'handcycle',
    'velomobile',
  ]);
  const strength = new Set([
    'weighttraining',
    'crossfit',
    'workout',
    'highintensityintervaltraining',
  ]);

  const walkKo = new Set(['걷기', '하이킹', '등산']);
  const runKo = new Set(['달리기', '러닝', '조깅', '트레일런']);
  const bikeKo = new Set(['라이딩', '라이드', '자전거', '사이클', '싸이클']);
  const strengthKo = new Set(['근력', '근육', '웨이트', '헬스', '크로스핏']);

  if (walk.has(key) || walkKo.has(raw)) return '🚶🏻‍♀️';
  if (run.has(key) || runKo.has(raw)) return '🏃🏻‍♀️';
  if (bike.has(key) || bikeKo.has(raw)) return '🚲';
  if (strength.has(key) || strengthKo.has(raw)) return '💪';
  return '🏃🏻‍♀️';
}

function toSummary(a: StravaActivity): StravaActivitySummary {
  const distM = a.distance ?? 0;
  const moveSec = a.moving_time ?? a.elapsed_time ?? 0;
  const distanceKm = distM / 1000;
  const durationMinutes = Math.round(moveSec / 60);
  const avgPace = distanceKm > 0 ? moveSec / 60 / distanceKm : null;

  return {
    activityId: a.id,
    activityName: a.name || 'Activity',
    sportType: (a.sport_type || a.type || 'Run').trim(),
    startTimeLocal: a.start_date_local,
    distanceKm: Math.round(distanceKm * 100) / 100,
    durationMinutes,
    calories: a.calories || 0,
    averageHR: a.average_heartrate || 0,
    maxHR: a.max_heartrate || 0,
    elevationGain: Math.round(a.total_elevation_gain || 0),
    averagePaceMinPerKm: avgPace ? Math.round(avgPace * 100) / 100 : null,
    locationName: '',
  };
}

// ---------------------------------------------------------------------------
// OAuth
// ---------------------------------------------------------------------------

export function getStravaAuthUrl(state?: string): string {
  const params = new URLSearchParams({
    client_id: STRAVA_CLIENT_ID,
    redirect_uri: STRAVA_REDIRECT_URI,
    response_type: 'code',
    scope: 'read,activity:read_all',
    approval_prompt: 'force',
  });
  if (state) params.set('state', state);
  return `https://www.strava.com/oauth/authorize?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string) {
  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Strava token exchange failed: ${text}`);
  }
  return (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_at: number;
    expires_in: number;
    athlete: { id: number; firstname: string; lastname: string };
  };
}

export async function refreshAccessToken(refreshToken: string) {
  const res = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Strava token refresh failed: ${text}`);
  }
  return (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_at: number;
    expires_in: number;
  };
}

// ---------------------------------------------------------------------------
// Activities
// ---------------------------------------------------------------------------

export type FetchActivitiesByDateOptions = {
  /** test-sync 등에서 원인 분석용 로그 */
  debugLog?: string[];
};

/**
 * 해당 KST 달력 날짜의 Strava 활동 전부 (러닝만이 아님: Workout, Ride 등 포함).
 *
 * Strava `after`/`before`만으로는 UTC 경계 때문에 같은 날 활동이 빠질 수 있어,
 * 넓은 에폭 창으로 받은 뒤 KST 기준 날짜로 맞춥니다.
 */
export async function fetchActivitiesByDate(
  accessToken: string,
  dateStr: string,
  options?: FetchActivitiesByDateOptions
): Promise<StravaActivitySummary[]> {
  const dbg = options?.debugLog;

  const noonKst = new Date(`${dateStr}T12:00:00+09:00`);
  const afterSec = Math.floor((noonKst.getTime() - 20 * 3600 * 1000) / 1000);
  const beforeSec = Math.floor((noonKst.getTime() + 20 * 3600 * 1000) / 1000);

  const all: StravaActivity[] = [];
  const perPage = 50;
  for (let page = 1; page <= 25; page += 1) {
    const params = new URLSearchParams({
      after: String(afterSec),
      before: String(beforeSec),
      per_page: String(perPage),
      page: String(page),
    });

    const res = await fetch(
      `https://www.strava.com/api/v3/athlete/activities?${params.toString()}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Strava activities fetch failed: ${text}`);
    }

    const batch = (await res.json()) as StravaActivity[];
    if (!batch.length) break;
    all.push(...batch);
    if (batch.length < perPage) break;
  }

  let onKstDay = all.filter((a) => activityKstCalendarDate(a) === dateStr);
  onKstDay = onKstDay.sort((a, b) => {
    const ta = new Date(a.start_date || a.start_date_local || 0).getTime();
    const tb = new Date(b.start_date || b.start_date_local || 0).getTime();
    return tb - ta;
  });

  if (dbg) {
    dbg.push(
      `Strava API: ${all.length}건(에폭 창), 그중 KST ${dateStr} 일치 ${onKstDay.length}건`
    );
    if (onKstDay.length > 0) {
      dbg.push(
        `KST 해당일 활동: ${onKstDay
          .map((a) => `${a.name?.slice(0, 24) || '?'}:${a.sport_type || a.type}`)
          .join(' | ')}`
      );
    }
  }

  return onKstDay.map(toSummary);
}

/**
 * Fetch today's activities (KST, 모든 종류).
 */
export async function fetchTodayActivities(
  accessToken: string
): Promise<StravaActivitySummary[]> {
  const todayStr = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' })
  ).toISOString().slice(0, 10);
  return fetchActivitiesByDate(accessToken, todayStr);
}

/**
 * Get a valid access token, refreshing if needed.
 */
export async function getValidAccessToken(
  storedToken: {
    access_token: string;
    refresh_token: string;
    token_expires_at?: string | null;
  }
): Promise<{ access_token: string; refresh_token: string; expires_at: number }> {
  const expiresAt = storedToken.token_expires_at
    ? new Date(storedToken.token_expires_at).getTime() / 1000
    : 0;

  // Refresh if token expires within 5 minutes
  if (expiresAt > 0 && expiresAt - Date.now() / 1000 > 300) {
    return {
      access_token: storedToken.access_token,
      refresh_token: storedToken.refresh_token,
      expires_at: expiresAt,
    };
  }

  const refreshed = await refreshAccessToken(storedToken.refresh_token);
  return {
    access_token: refreshed.access_token,
    refresh_token: refreshed.refresh_token,
    expires_at: refreshed.expires_at,
  };
}

// ---------------------------------------------------------------------------
// RunLog / Instagram copy (multi-activity same KST day)
// ---------------------------------------------------------------------------

export function sumActivitiesMetrics(activities: StravaActivitySummary[]) {
  const totalDistanceKm = activities.reduce((s, a) => s + (a.distanceKm || 0), 0);
  const totalDurationMinutes = activities.reduce((s, a) => s + (a.durationMinutes || 0), 0);
  const totalCalories = activities.reduce((s, a) => s + (a.calories || 0), 0);
  return {
    totalDistanceKm: Math.round(totalDistanceKm * 100) / 100,
    totalDurationMinutes,
    totalCalories,
  };
}

export function formatDurationKorean(durationMinutes: number): string {
  const h = Math.floor(durationMinutes / 60);
  const m = durationMinutes % 60;
  return `${h > 0 ? `${h}시간 ` : ''}${m}분`;
}

/** Instagram 캡션·카드용 영문 시간 (`2h 43m`, `45m`) */
export function formatDurationInstagramEn(minutes: number): string {
  if (minutes <= 0) return '';
  const totalM = Math.max(0, Math.round(minutes));
  const h = Math.floor(totalM / 60);
  const m = totalM % 60;
  if (h <= 0) return `${m}m`;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

const INSTAGRAM_CAPTION_HASHTAGS =
  '#runlog #running  #ランニング #ルーティン #러닝 #루틴';

/** `YYYY-MM-DD` (KST 기준으로 ISO/타임스탬프 보정) — 카드·캡션 공통 */
export function formatInstagramCalendarDate(dateStr: string): string {
  const s = (dateStr || '').trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (s.length >= 10 && s[4] === '-' && s[7] === '-') return s.slice(0, 10);
  const t = Date.parse(s);
  if (!Number.isNaN(t)) {
    return new Date(t).toLocaleDateString('en-CA', {
      timeZone: 'Asia/Seoul',
    });
  }
  return s.slice(0, 10) || s;
}

function singleActivityRecordLines(a: StravaActivitySummary): string[] {
  const parts: string[] = [];
  if (a.distanceKm > 0) parts.push(`거리: ${a.distanceKm}km`);
  if (a.durationMinutes > 0) parts.push(`시간: ${formatDurationKorean(a.durationMinutes)}`);
  if (a.averagePaceMinPerKm) {
    const mins = Math.floor(a.averagePaceMinPerKm);
    const secs = Math.round((a.averagePaceMinPerKm - mins) * 60);
    parts.push(`평균 페이스: ${mins}'${secs.toString().padStart(2, '0')}"/km`);
  }
  if (a.calories > 0) parts.push(`소모 칼로리: ${a.calories}kcal`);
  if (a.averageHR > 0) parts.push(`평균 심박: ${a.averageHR}bpm`);
  if (a.elevationGain > 0) parts.push(`고도 상승: ${a.elevationGain}m`);
  return parts;
}

/** RunLog 본문: 같은 날 여러 활동이면 건별 블록 + 합계. */
export function buildStravaRecordContent(activities: StravaActivitySummary[]): string {
  if (activities.length === 0) return '(Strava 자동 동기화)';
  const blocks: string[] = [];
  activities.forEach((a, i) => {
    if (activities.length > 1) {
      blocks.push(`── ${i + 1}. ${a.activityName} ──`);
    }
    blocks.push(...singleActivityRecordLines(a));
    if (i < activities.length - 1) blocks.push('');
  });
  if (activities.length > 1) {
    const sum = sumActivitiesMetrics(activities);
    blocks.push('— 합계 —');
    if (sum.totalDistanceKm > 0) blocks.push(`거리: ${sum.totalDistanceKm}km`);
    if (sum.totalDurationMinutes > 0) {
      blocks.push(`시간: ${formatDurationKorean(sum.totalDurationMinutes)}`);
    }
    if (sum.totalCalories > 0) blocks.push(`소모 칼로리: ${sum.totalCalories}kcal`);
  }
  blocks.push('(Strava 자동 동기화)');
  return blocks.join('\n');
}

/**
 * Instagram 업로드 캡션 (심플 블록).
 * 단일: 종목 이모지+이름 → ⌚️ 영문 시간 → 📅 날짜 → 해시태그.
 * 복수: 활동별 동일 블록을 빈 줄로 구분한 뒤 마지막에 📅·태그 한 번.
 */
export function buildStravaInstagramCaption(
  activities: StravaActivitySummary[],
  dateStr: string
): string {
  const cal = formatInstagramCalendarDate(dateStr);
  if (activities.length === 0) {
    return `📅 ${cal}\n\n${INSTAGRAM_CAPTION_HASHTAGS}`;
  }

  const blocks: string[] = [];
  activities.forEach((a) => {
    const name = (a.activityName || 'Activity').trim() || 'Activity';
    const lines: string[] = [
      `${stravaSportTypeEmoji(a.sportType)} ${name}`,
    ];
    const dur = formatDurationInstagramEn(a.durationMinutes);
    if (dur) lines.push(`⌚️ ${dur}`);
    blocks.push(lines.join('\n'));
  });

  const body = blocks.join('\n\n');
  return `${body}\n📅 ${cal}\n\n${INSTAGRAM_CAPTION_HASHTAGS}`;
}

/** DB title: 단일은 활동명, 복수는 날짜·건수. */
export function stravaSyncRecordTitle(
  activities: StravaActivitySummary[],
  dateStr: string
): string {
  if (activities.length === 0) return `Running ${dateStr}`;
  if (activities.length === 1) {
    return activities[0].activityName || `Running ${dateStr}`;
  }
  return `${dateStr} · 활동 ${activities.length}건`;
}
