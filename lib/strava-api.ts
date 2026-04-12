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

function toSummary(a: StravaActivity): StravaActivitySummary {
  const distanceKm = a.distance / 1000;
  const durationMinutes = Math.round(a.moving_time / 60);
  const avgPace = distanceKm > 0 ? a.moving_time / 60 / distanceKm : null;

  return {
    activityId: a.id,
    activityName: a.name || 'Running',
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

/**
 * Fetch running activities for a specific date (YYYY-MM-DD).
 * Uses epoch-based after/before filtering.
 */
export async function fetchActivitiesByDate(
  accessToken: string,
  dateStr: string
): Promise<StravaActivitySummary[]> {
  // KST date range → UTC epoch
  const dayStart = new Date(`${dateStr}T00:00:00+09:00`);
  const dayEnd = new Date(`${dateStr}T23:59:59+09:00`);

  const params = new URLSearchParams({
    after: String(Math.floor(dayStart.getTime() / 1000)),
    before: String(Math.floor(dayEnd.getTime() / 1000)),
    per_page: '30',
  });

  const res = await fetch(
    `https://www.strava.com/api/v3/athlete/activities?${params.toString()}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Strava activities fetch failed: ${text}`);
  }

  const activities = (await res.json()) as StravaActivity[];

  // Filter for running/trail running only
  const runTypes = ['Run', 'TrailRun', 'VirtualRun'];
  const runs = activities.filter(
    (a) => runTypes.includes(a.type) || runTypes.includes(a.sport_type)
  );

  return runs.map(toSummary);
}

/**
 * Fetch today's running activities.
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
