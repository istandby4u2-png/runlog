/**
 * Google Photos Picker API
 * @see https://developers.google.com/photos/picker/guides/get-started-picker
 *
 * The Library API scopes (photoslibrary.readonly) were deprecated March 31, 2025.
 * This module uses the Picker API (photospicker.mediaitems.readonly) instead.
 *
 * Client-side: NEXT_PUBLIC_GOOGLE_PHOTOS_CLIENT_ID (OAuth 웹 클라이언트 ID)
 * Server-side (cron): GOOGLE_CLIENT_SECRET, refresh_token stored in user_tokens table
 */

export interface GooglePhotosMediaItem {
  id: string;
  baseUrl: string;
  filename?: string;
  mimeType?: string;
  mediaMetadata?: {
    creationTime?: string;
    photo?: { cameraMake?: string };
    video?: Record<string, unknown>;
  };
}

export interface PickedMediaItem {
  id: string;
  type: 'PHOTO' | 'VIDEO';
  mediaFile: {
    baseUrl: string;
    mimeType: string;
    filename?: string;
  };
}

export interface PickerSession {
  id: string;
  pickerUri: string;
  pollingConfig?: {
    pollInterval?: string;
    timeoutIn?: string;
  };
  mediaItemsSet?: boolean;
}

// ---------------------------------------------------------------------------
// Server-side OAuth helpers (for cron / background jobs)
// ---------------------------------------------------------------------------

const GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_PHOTOS_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GOOGLE_REDIRECT_URI =
  process.env.GOOGLE_REDIRECT_URI || 'https://runlog.life/api/oauth/google/callback';

export function getGoogleAuthUrl(state?: string): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/photospicker.mediaitems.readonly',
    access_type: 'offline',
    prompt: 'consent',
  });
  if (state) params.set('state', state);
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: GOOGLE_REDIRECT_URI,
      grant_type: 'authorization_code',
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google token exchange failed: ${text}`);
  }
  return (await res.json()) as {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    token_type: string;
  };
}

export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google token refresh failed: ${text}`);
  }
  return (await res.json()) as { access_token: string; expires_in: number };
}

// ---------------------------------------------------------------------------
// Picker API: session management
// @see https://developers.google.com/photos/picker/guides/sessions
// ---------------------------------------------------------------------------

const PICKER_API_BASE = 'https://photospicker.googleapis.com/v1';

export async function createPickerSession(accessToken: string): Promise<PickerSession> {
  const res = await fetch(`${PICKER_API_BASE}/sessions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: '{}',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Picker session create failed (${res.status}): ${text}`);
  }
  return (await res.json()) as PickerSession;
}

export async function getPickerSession(
  accessToken: string,
  sessionId: string
): Promise<PickerSession> {
  const res = await fetch(`${PICKER_API_BASE}/sessions/${sessionId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Picker session get failed (${res.status}): ${text}`);
  }
  return (await res.json()) as PickerSession;
}

export async function listPickedMediaItems(
  accessToken: string,
  sessionId: string
): Promise<PickedMediaItem[]> {
  const items: PickedMediaItem[] = [];
  let pageToken: string | undefined;

  do {
    const url = new URL(`${PICKER_API_BASE}/mediaItems`);
    url.searchParams.set('sessionId', sessionId);
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Picker list media failed (${res.status}): ${text}`);
    }
    const data = (await res.json()) as {
      mediaItems?: PickedMediaItem[];
      nextPageToken?: string;
    };
    if (data.mediaItems) items.push(...data.mediaItems);
    pageToken = data.nextPageToken;
  } while (pageToken);

  return items;
}

export async function deletePickerSession(
  accessToken: string,
  sessionId: string
): Promise<void> {
  await fetch(`${PICKER_API_BASE}/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

// ---------------------------------------------------------------------------
// Photo download (works with Picker API baseUrls)
// Picker API baseUrls require Authorization header
// ---------------------------------------------------------------------------

export async function downloadPhotoAsBuffer(
  baseUrl: string,
  accessToken: string
): Promise<{ buffer: Buffer; contentType: string }> {
  const url = `${baseUrl}=d`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('사진을 다운로드할 수 없습니다.');
  const arrayBuffer = await res.arrayBuffer();
  const contentType = res.headers.get('content-type') || 'image/jpeg';
  return { buffer: Buffer.from(arrayBuffer), contentType };
}
