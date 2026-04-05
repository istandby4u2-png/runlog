/**
 * Google Photos Library API (클라이언트에서 액세스 토큰으로 호출)
 * @see https://developers.google.com/photos/library/guides/overview
 *
 * 배포 시 필요: NEXT_PUBLIC_GOOGLE_PHOTOS_CLIENT_ID (OAuth 웹 클라이언트 ID),
 * Google Cloud에서 Photos Library API 활성화 및 동의 화면에
 * `photoslibrary.readonly` 스코프 추가. authorized JavaScript origins에 사이트 URL 등록.
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

export async function searchPhotos(
  accessToken: string,
  pageToken?: string
): Promise<{ mediaItems: GooglePhotosMediaItem[]; nextPageToken?: string }> {
  const body: Record<string, unknown> = {
    pageSize: 50,
    filters: {
      mediaFilter: {
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

/** 원본에 가까운 바이트로 다운로드 후 File 생성 */
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
