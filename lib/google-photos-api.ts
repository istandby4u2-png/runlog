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
  /** 촬영·생성 시각(RFC3339). 일괄 배정 시 KST 달력 날짜 계산에 사용 */
  createTime?: string;
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

/** Refresh token was revoked, expired, or the Google account password changed. */
export const GOOGLE_RECONNECT_MESSAGE =
  'Google Photos 연결이 만료되었거나 해제되었습니다. Settings에서 Google Photos «연결 해제» 후 다시 «연결»해 주세요.';

export class GoogleRefreshTokenInvalidError extends Error {
  readonly code = 'GOOGLE_REFRESH_TOKEN_INVALID' as const;

  constructor(message: string = GOOGLE_RECONNECT_MESSAGE) {
    super(message);
    this.name = 'GoogleRefreshTokenInvalidError';
  }
}

export function isGoogleRefreshTokenInvalidError(
  e: unknown
): e is GoogleRefreshTokenInvalidError {
  if (e instanceof GoogleRefreshTokenInvalidError) return true;
  // Cross-bundle fallback: instanceof can fail when the same module is loaded in separate bundles
  if (e && typeof e === 'object' && 'code' in e) {
    return (e as { code: unknown }).code === 'GOOGLE_REFRESH_TOKEN_INVALID';
  }
  return false;
}

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

/** Token endpoint 4xx body: JSON, rarely form-encoded; BOM/prefixes can make JSON.parse fail. */
function parseGoogleTokenErrorResponse(raw: string): { error?: string; error_description?: string } {
  const text = raw.replace(/^\uFEFF/, '').trim();
  if (!text) return {};
  try {
    return JSON.parse(text) as { error?: string; error_description?: string };
  } catch {
    if (text.includes('=') && !text.startsWith('{')) {
      try {
        const params = new URLSearchParams(text);
        const err = params.get('error');
        if (err) return { error: err, error_description: params.get('error_description') ?? undefined };
      } catch {
        /* ignore */
      }
    }
    return {};
  }
}

function isInvalidGrantBody(text: string, parsed: { error?: string }): boolean {
  const code = String(parsed.error ?? '')
    .trim()
    .toLowerCase();
  if (code === 'invalid_grant') return true;
  return /\binvalid_grant\b/.test(text);
}

/**
 * `instanceof GoogleRefreshTokenInvalidError` can fail across bundles; use in API catch
 * as a fallback when the generic `Google token refresh failed: {...}` is still thrown.
 */
export function isGoogleOauthResponseRevokedErrorMessage(msg: string): boolean {
  if (!msg) return false;
  if (!/invalid_grant/i.test(msg)) return false;
  if (/Google token (refresh|exchange) failed/i.test(msg)) return true;
  if (/Token has been expired or revoked/i.test(msg)) return true;
  return false;
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
    const parsed = parseGoogleTokenErrorResponse(text);
    if (text.includes('invalid_grant') || isInvalidGrantBody(text, parsed)) {
      throw new GoogleRefreshTokenInvalidError();
    }
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
    const parsed = parseGoogleTokenErrorResponse(text);
    if (text.includes('invalid_grant') || isInvalidGrantBody(text, parsed)) {
      throw new GoogleRefreshTokenInvalidError();
    }
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

/**
 * @param opts.maxItemCount Google 기본 2000 — 일괄 선택 시 여유 있게 지정 가능
 */
export async function createPickerSession(
  accessToken: string,
  opts?: { maxItemCount?: number }
): Promise<PickerSession> {
  const body: Record<string, unknown> = {};
  if (opts?.maxItemCount != null) {
    body.pickingConfig = { maxItemCount: String(opts.maxItemCount) };
  }
  const res = await fetch(`${PICKER_API_BASE}/sessions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
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
