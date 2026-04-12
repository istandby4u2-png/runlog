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

/** Shown when access token lacks photospicker.mediaitems.readonly (e.g. old Library API link). */
export const GOOGLE_PICKER_SCOPE_ERROR =
  'Google Photos Picker 권한이 없습니다. 아래 «연결 해제» 후 «연결»을 눌러 다시 승인해 주세요. (이전 Library API만 허용된 연결은 재연결이 필요합니다.)';

export function getGoogleAuthUrl(state?: string): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: GOOGLE_REDIRECT_URI,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/photospicker.mediaitems.readonly',
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
  });
  if (state) params.set('state', state);
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

function isGoogleInsufficientScopeResponse(status: number, bodyText: string): boolean {
  if (status !== 403) return false;
  return (
    bodyText.includes('ACCESS_TOKEN_SCOPE_INSUFFICIENT') ||
    bodyText.includes('insufficient authentication scopes')
  );
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

/** Thrown when mediaItems.list returns FAILED_PRECONDITION (user has not finished picking). */
export class PickerListNotReadyError extends Error {
  constructor() {
    super('PICKER_LIST_NOT_READY');
    this.name = 'PickerListNotReadyError';
  }
}

/** Thrown when mediaItems.list returns 404 — session unknown or wrong account / expired. */
export class PickerListSessionNotFoundError extends Error {
  constructor(public readonly bodyText: string) {
    super('PICKER_LIST_NOT_FOUND');
    this.name = 'PickerListSessionNotFoundError';
  }
}

/**
 * Normalize sessions.create JSON — id may be under `name` or only in pickerUri query.
 */
export function pickingSessionFromCreateResponse(raw: unknown): PickerSession {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Picker 세션 응답 형식이 올바르지 않습니다.');
  }
  const o = raw as Record<string, unknown>;
  let id = typeof o.id === 'string' ? o.id.trim() : '';
  const name = typeof o.name === 'string' ? o.name.trim() : '';
  if (!id && name) {
    id = name.replace(/^sessions\//, '').trim();
  }
  const pickerUri = typeof o.pickerUri === 'string' ? o.pickerUri.trim() : '';
  if (!id && pickerUri) {
    try {
      const u = new URL(pickerUri);
      const cand =
        u.searchParams.get('sessionId') ||
        u.searchParams.get('session_id') ||
        u.searchParams.get('sid') ||
        u.searchParams.get('s');
      if (cand) id = cand.trim();
    } catch {
      // ignore
    }
  }
  if (!id) {
    throw new Error(
      'Picker 세션 ID를 응답에서 찾을 수 없습니다. Google Cloud에서 Photos Picker API가 활성화되어 있는지 확인해 주세요.'
    );
  }
  return {
    id,
    pickerUri,
    pollingConfig: o.pollingConfig as PickerSession['pollingConfig'],
    mediaItemsSet: Boolean(o.mediaItemsSet),
  };
}

function normalizePickerSessionId(sessionId: string): string {
  return sessionId.replace(/^sessions\//, '').trim();
}

function sessionPathSegment(sessionId: string): string {
  return encodeURIComponent(normalizePickerSessionId(sessionId));
}

function isMediaListFailedPrecondition(status: number, body: string): boolean {
  if (status !== 400 && status !== 412) return false;
  return (
    body.includes('FAILED_PRECONDITION') ||
    body.toLowerCase().includes('failed precondition')
  );
}

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
    if (isGoogleInsufficientScopeResponse(res.status, text)) {
      throw new Error(GOOGLE_PICKER_SCOPE_ERROR);
    }
    throw new Error(`Picker session create failed (${res.status}): ${text}`);
  }
  const raw = await res.json();
  return pickingSessionFromCreateResponse(raw);
}

/**
 * Poll session status. Returns `null` if the session no longer exists (404).
 * After the user taps Done, Google may end the session immediately — the next
 * `sessions.get` can be NOT_FOUND even though `mediaItems.list` still works.
 */
export async function getPickerSession(
  accessToken: string,
  sessionId: string
): Promise<PickerSession | null> {
  const res = await fetch(`${PICKER_API_BASE}/sessions/${sessionPathSegment(sessionId)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (res.status === 404) {
    return null;
  }
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

  const sid = normalizePickerSessionId(sessionId);

  do {
    const url = new URL(`${PICKER_API_BASE}/mediaItems`);
    url.searchParams.set('sessionId', sid);
    if (pageToken) url.searchParams.set('pageToken', pageToken);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      const text = await res.text();
      if (isMediaListFailedPrecondition(res.status, text)) {
        throw new PickerListNotReadyError();
      }
      if (res.status === 404) {
        throw new PickerListSessionNotFoundError(text);
      }
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
  await fetch(`${PICKER_API_BASE}/sessions/${sessionPathSegment(sessionId)}`, {
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
