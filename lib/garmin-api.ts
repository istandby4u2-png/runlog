import { GarminConnect } from '@flow-js/garmin-connect';
import { ActivityType, type IActivity } from '@flow-js/garmin-connect';

const GARMIN_EMAIL = process.env.GARMIN_EMAIL;
const GARMIN_PASSWORD = process.env.GARMIN_PASSWORD;

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
