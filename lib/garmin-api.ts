import { GarminConnect } from '@flow-js/garmin-connect';
import {
  ActivityType,
  type IActivity,
  type IOauth1Token,
  type IOauth2Token,
} from '@flow-js/garmin-connect';
import type { StravaActivitySummary } from '@/lib/strava-api';

const GARMIN_EMAIL = process.env.GARMIN_EMAIL;
const GARMIN_PASSWORD = process.env.GARMIN_PASSWORD;
/** scripts/garmin-login.mjs로 발급한 OAuth 토큰 JSON — MFA 계정도 동작, oauth1은 ~1년 유효 */
const GARMIN_OAUTH1_TOKEN = process.env.GARMIN_OAUTH1_TOKEN;
const GARMIN_OAUTH2_TOKEN = process.env.GARMIN_OAUTH2_TOKEN;

export interface GarminActivitySummary {
  activityId: number;
  activityName: string;
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

function toSummary(activity: IActivity): GarminActivitySummary {
  const distanceKm = (activity.distance || 0) / 1000;
  const durationMinutes = Math.round((activity.duration || 0) / 60);
  const avgPace =
    distanceKm > 0
      ? (activity.duration || 0) / 60 / distanceKm
      : null;

  return {
    activityId: activity.activityId,
    activityName: activity.activityName || 'Running',
    startTimeLocal: activity.startTimeLocal,
    distanceKm: Math.round(distanceKm * 100) / 100,
    durationMinutes,
    calories: activity.calories || 0,
    averageHR: activity.averageHR || 0,
    maxHR: activity.maxHR || 0,
    elevationGain: activity.elevationGain || 0,
    averagePaceMinPerKm: avgPace ? Math.round(avgPace * 100) / 100 : null,
    locationName: activity.locationName || '',
  };
}

export async function createGarminClient(): Promise<GarminConnect> {
  // 우선: 미리 발급한 OAuth 토큰 (비밀번호 로그인 불가·MFA 계정용, HttpClient가 oauth2 자동 갱신)
  if (GARMIN_OAUTH1_TOKEN && GARMIN_OAUTH2_TOKEN) {
    const client = new GarminConnect({
      username: GARMIN_EMAIL || '',
      password: GARMIN_PASSWORD || '',
    });
    client.loadToken(
      JSON.parse(GARMIN_OAUTH1_TOKEN) as IOauth1Token,
      JSON.parse(GARMIN_OAUTH2_TOKEN) as IOauth2Token
    );
    return client;
  }

  if (!GARMIN_EMAIL || !GARMIN_PASSWORD) {
    throw new Error('GARMIN_EMAIL / GARMIN_PASSWORD 환경 변수가 설정되지 않았습니다.');
  }
  const client = new GarminConnect({
    username: GARMIN_EMAIL,
    password: GARMIN_PASSWORD,
  });
  await client.login();
  return client;
}

/** Garmin activityType.typeKey → Strava sport_type 호환 문자열 (카드 이모지·캡션 로직 재사용) */
function garminTypeToStravaSportType(typeKey: string): string {
  const key = (typeKey || '').toLowerCase();
  if (key.includes('running')) return 'Run';
  if (key.includes('hiking')) return 'Hike';
  if (key.includes('walking')) return 'Walk';
  if (key.includes('cycling') || key.includes('biking')) return 'Ride';
  if (key.includes('strength')) return 'WeightTraining';
  if (key.includes('hiit') || key.includes('cardio') || key.includes('fitness')) return 'Workout';
  return 'Workout';
}

function toStravaSummary(a: IActivity): StravaActivitySummary {
  const distanceKm = (a.distance || 0) / 1000;
  const moveSec = a.movingDuration || a.duration || 0;
  const durationMinutes = Math.round(moveSec / 60);
  const avgPace = distanceKm > 0 ? moveSec / 60 / distanceKm : null;

  return {
    activityId: Number(a.activityId),
    activityName: a.activityName || 'Activity',
    sportType: garminTypeToStravaSportType(a.activityType?.typeKey || ''),
    startTimeLocal: a.startTimeLocal,
    distanceKm: Math.round(distanceKm * 100) / 100,
    durationMinutes,
    calories: Math.round(a.calories || 0),
    averageHR: Math.round(a.averageHR || 0),
    maxHR: Math.round(a.maxHR || 0),
    elevationGain: Math.round(a.elevationGain || 0),
    averagePaceMinPerKm: avgPace ? Math.round(avgPace * 100) / 100 : null,
    locationName: a.locationName || '',
  };
}

/**
 * daily-sync용: 해당 달력 날짜(워치 로컬 시간 = KST)의 모든 종류 활동을
 * StravaActivitySummary 호환 형태로 반환 (최신순).
 * Strava Developer Program 유료화(2026-06-30) 이후 Strava 대신 사용.
 */
export async function fetchDayActivitySummaries(
  dateStr: string
): Promise<StravaActivitySummary[]> {
  const client = await createGarminClient();
  const activities = await client.getActivities(0, 100);

  const matched = activities.filter(
    (a) => (a.startTimeLocal || '').slice(0, 10) === dateStr
  );
  matched.sort((a, b) =>
    (b.startTimeLocal || '').localeCompare(a.startTimeLocal || '')
  );
  return matched.map(toStravaSummary);
}

/**
 * Fetch today's running activities from Garmin Connect.
 * Returns summaries sorted by startTimeLocal (newest first).
 */
export async function fetchTodayActivities(): Promise<GarminActivitySummary[]> {
  const client = await createGarminClient();

  // Fetch recent running activities (up to 20)
  const activities = await client.getActivities(0, 20, ActivityType.Running);

  const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const todayActivities = activities.filter((a) => {
    const actDate = (a.startTimeLocal || '').slice(0, 10);
    return actDate === todayStr;
  });

  return todayActivities.map(toSummary);
}

/**
 * Fetch running activities for a specific date (YYYY-MM-DD).
 * Scans up to 100 recent activities to find matches.
 */
export async function fetchActivitiesByDate(dateStr: string): Promise<GarminActivitySummary[]> {
  const client = await createGarminClient();
  const activities = await client.getActivities(0, 100, ActivityType.Running);

  const matched = activities.filter((a) => {
    const actDate = (a.startTimeLocal || '').slice(0, 10);
    return actDate === dateStr;
  });

  return matched.map(toSummary);
}

/**
 * Fetch the most recent running activity (any date).
 * Useful as a fallback when no activity exists for today.
 */
export async function fetchLatestActivity(): Promise<GarminActivitySummary | null> {
  const client = await createGarminClient();
  const activities = await client.getActivities(0, 1, ActivityType.Running);
  if (activities.length === 0) return null;
  return toSummary(activities[0]);
}

/**
 * Fetch sleep data for today from Garmin.
 */
export async function fetchSleepData(date?: Date) {
  const client = await createGarminClient();
  try {
    const sleep = await client.getSleepDuration(date);
    return {
      hours: sleep.hours + sleep.minutes / 60,
      quality: null as string | null,
    };
  } catch {
    return null;
  }
}
