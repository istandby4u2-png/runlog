/**
 * Google Photos Library API
 * @see https://developers.google.com/photos/library/guides/overview
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
    scope: 'https://www.googleapis.com/auth/photoslibrary.readonly',
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
// Photos search / download (works with both client-side and server-side tokens)
// ---------------------------------------------------------------------------

export async function searchPhotos(
  accessToken: string,
  pageToken?: string
): Promise<{ mediaItems: GooglePhotosMediaItem[]; nextPageToken?: string }> {
  const body: Record<string, unknown> = {
    pageSize: 50,
    filters: {
      mediaTypeFilter: {
        mediaTypes: ['PHOTO'],
      },
    },
  };
  if (pageToken) {
    body.pageToken = pageToken;
  }

  const res = await fetch('https://photoslibrary.googleapis.com/v1/mediaItems:search', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (res.status === 401) {
    throw new Error('UNAUTHORIZED');
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Google Photos API 오류 (${res.status})`);
  }

  const data = (await res.json()) as {
    mediaItems?: GooglePhotosMediaItem[];
    nextPageToken?: string;
  };

  return {
    mediaItems: data.mediaItems ?? [],
    nextPageToken: data.nextPageToken,
  };
}

/**
 * Search photos filtered by a specific date (KST).
 * Uses the Google Photos dateFilter API.
 */
export async function searchPhotosByDate(
  accessToken: string,
  date: Date
): Promise<GooglePhotosMediaItem[]> {
  const body = {
    pageSize: 25,
    filters: {
      dateFilter: {
        dates: [
          {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate(),
          },
        ],
      },
      mediaTypeFilter: { mediaTypes: ['PHOTO'] },
    },
  };

  const res = await fetch('https://photoslibrary.googleapis.com/v1/mediaItems:search', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Google Photos date search failed (${res.status})`);
  }

  const data = (await res.json()) as { mediaItems?: GooglePhotosMediaItem[] };
  return data.mediaItems ?? [];
}

/**
 * Google Photos content category filter.
 * @see https://developers.google.com/photos/library/reference/rest/v1/mediaItems/search#ContentCategory
 */
type ContentCategory =
  | 'LANDSCAPES'
  | 'CITYSCAPES'
  | 'LANDMARKS'
  | 'SELFIES'
  | 'PEOPLE'
  | 'PETS'
  | 'TRAVEL'
  | 'ANIMALS'
  | 'FOOD'
  | 'SPORT'
  | 'NIGHT'
  | 'GARDENS'
  | 'FLOWERS';

/**
 * Search photos by date + content category (e.g. LANDSCAPES for sky/nature).
 * Google Photos API natively supports content-based filtering.
 */
export async function searchPhotosByDateAndContent(
  accessToken: string,
  date: Date,
  categories: ContentCategory[] = ['LANDSCAPES']
): Promise<GooglePhotosMediaItem[]> {
  const body = {
    pageSize: 25,
    filters: {
      dateFilter: {
        dates: [
          {
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate(),
          },
        ],
      },
      mediaTypeFilter: { mediaTypes: ['PHOTO'] },
      contentFilter: {
        includedContentCategories: categories,
      },
    },
  };

  const res = await fetch('https://photoslibrary.googleapis.com/v1/mediaItems:search', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Google Photos content search failed (${res.status})`);
  }

  const data = (await res.json()) as { mediaItems?: GooglePhotosMediaItem[] };
  return data.mediaItems ?? [];
}

/** Download a photo as a Buffer (server-side friendly). */
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

/** 원본에 가까운 바이트로 다운로드 후 File 생성 (client-side) */
export async function downloadPhotoAsFile(
  baseUrl: string,
  accessToken: string,
  suggestedName: string
): Promise<File> {
  const url = `${baseUrl}=d`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error('사진을 다운로드할 수 없습니다.');
  }

  const blob = await res.blob();
  const type = blob.type || 'image/jpeg';
  let ext = 'jpg';
  if (type.includes('png')) ext = 'png';
  else if (type.includes('webp')) ext = 'webp';
  else if (type.includes('gif')) ext = 'gif';

  const safe =
    suggestedName?.replace(/[^\w.\-가-힣]/g, '_').slice(0, 80) || `google-photo-${Date.now()}`;
  const base = safe.includes('.') ? safe : `${safe}.${ext}`;

  return new File([blob], base, { type });
}

/** 썸네일 URL (토큰을 쿼리로 전달해야 할 수 있음) */
export function getPhotoThumbnailUrl(baseUrl: string, accessToken: string, size = 200): string {
  return `${baseUrl}=w${size}-h${size}-c&access_token=${encodeURIComponent(accessToken)}`;
}
