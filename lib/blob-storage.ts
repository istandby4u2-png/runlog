import { put, del } from '@vercel/blob';
import { supabaseAdmin } from '@/lib/supabase';

export type UploadImageDetailedResult =
  | { ok: true; url: string; storage?: 'vercel-blob' | 'supabase' }
  | { ok: false; error: string };

function blobUploadErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

/** Vercel이 연결한 Blob 토큰 (이름이 조금 다를 때 대비) */
function getBlobReadWriteToken(): string | undefined {
  const a = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (a) return a;
  const b = process.env.VERCEL_BLOB_READ_WRITE_TOKEN?.trim();
  if (b) return b;
  return undefined;
}

function hasBlobReadWriteToken(): boolean {
  return Boolean(getBlobReadWriteToken());
}

/** Content-Type이 비어 있거나 octet-stream일 때 바이트 시그니처로 보정 */
function sniffImageType(buffer: Buffer): { mime: string; ext: string } | null {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: 'image/jpeg', ext: 'jpg' };
  }
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return { mime: 'image/png', ext: 'png' };
  }
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
    return { mime: 'image/gif', ext: 'gif' };
  }
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { mime: 'image/webp', ext: 'webp' };
  }
  return null;
}

function resolveUploadMimeAndExt(buffer: Buffer, hint: string): { mime: string; ext: string } {
  const raw = (hint || '').split(';')[0].trim().toLowerCase();
  const looksBinary =
    !raw ||
    raw === 'application/octet-stream' ||
    raw === 'binary/octet-stream' ||
    !raw.startsWith('image/');
  if (!looksBinary) {
    const ext =
      raw === 'image/png'
        ? 'png'
        : raw === 'image/webp'
          ? 'webp'
          : raw === 'image/gif'
            ? 'gif'
            : raw === 'image/jpeg' || raw === 'image/jpg'
              ? 'jpg'
              : raw === 'image/heic' || raw === 'image/heif'
                ? 'heic'
                : 'jpg';
    return { mime: raw, ext };
  }
  const sn = sniffImageType(buffer);
  if (sn) return sn;
  return { mime: 'image/jpeg', ext: 'jpg' };
}

/** Node 런타임에서 `File` 없이 Vercel Blob에 업로드 (서버리스 호환) */
async function uploadBufferToVercelBlob(
  buffer: Buffer,
  folder: 'records' | 'courses' | 'profiles',
  mime: string,
  ext: string
): Promise<UploadImageDetailedResult> {
  const token = getBlobReadWriteToken();
  if (!token) {
    return {
      ok: false,
      error:
        'BLOB_READ_WRITE_TOKEN 없음 — Vercel Dashboard → Storage → Blob → Connect to project',
    };
  }
  try {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const uniqueFilename = `${folder}/${timestamp}-${randomStr}.${ext}`;
    const blob = await put(uniqueFilename, buffer, {
      access: 'public',
      contentType: mime,
      token,
    });
    return { ok: true, url: blob.url, storage: 'vercel-blob' };
  } catch (e: unknown) {
    return { ok: false, error: blobUploadErrorMessage(e) };
  }
}

function isSupabaseCardBucketConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_PUBLIC_CARD_BUCKET?.trim() && supabaseAdmin
  );
}

/** Instagram 카드 JPEG → Supabase 공개 버킷 (Vercel Blob 할당량과 분리) */
async function uploadInstagramCardToSupabase(
  buffer: Buffer,
  folder: 'records' | 'courses' | 'profiles'
): Promise<UploadImageDetailedResult> {
  const bucket = process.env.SUPABASE_PUBLIC_CARD_BUCKET?.trim();
  if (!bucket || !supabaseAdmin) {
    return { ok: false, error: 'SUPABASE_PUBLIC_CARD_BUCKET 미설정' };
  }
  try {
    const ts = Date.now();
    const rand = Math.random().toString(36).substring(2, 8);
    const path = `${folder}/${ts}-${rand}.jpg`;
    const { error } = await supabaseAdmin.storage.from(bucket).upload(path, buffer, {
      contentType: 'image/jpeg',
      upsert: false,
    });
    if (error) {
      return { ok: false, error: error.message };
    }
    const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
    if (!data?.publicUrl) {
      return { ok: false, error: 'public URL 없음' };
    }
    return { ok: true, url: data.publicUrl, storage: 'supabase' };
  } catch (e: unknown) {
    return { ok: false, error: blobUploadErrorMessage(e) };
  }
}

/** Google 포토 등에서 받은 바이너리 → Supabase 공개 버킷 (JPEG 외 MIME 지원) */
async function uploadImageBufferToSupabasePublic(
  buffer: Buffer,
  folder: 'records' | 'courses' | 'profiles',
  contentType: string
): Promise<UploadImageDetailedResult> {
  const bucket = process.env.SUPABASE_PUBLIC_CARD_BUCKET?.trim();
  if (!bucket || !supabaseAdmin) {
    return { ok: false, error: 'SUPABASE_PUBLIC_CARD_BUCKET 미설정' };
  }
  const ct = (contentType || 'image/jpeg').split(';')[0].trim().toLowerCase() || 'image/jpeg';
  let ext = 'jpg';
  if (ct === 'image/png') ext = 'png';
  else if (ct === 'image/webp') ext = 'webp';
  else if (ct === 'image/gif') ext = 'gif';
  else if (ct === 'image/jpeg' || ct === 'image/jpg') ext = 'jpg';
  else if (ct === 'image/heic' || ct === 'image/heif') ext = 'heic';
  try {
    const ts = Date.now();
    const rand = Math.random().toString(36).substring(2, 8);
    const path = `${folder}/${ts}-${rand}.${ext}`;
    const { error } = await supabaseAdmin.storage.from(bucket).upload(path, buffer, {
      contentType: ct,
      upsert: false,
    });
    if (error) {
      return { ok: false, error: error.message };
    }
    const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
    if (!data?.publicUrl) {
      return { ok: false, error: 'public URL 없음' };
    }
    return { ok: true, url: data.publicUrl, storage: 'supabase' };
  } catch (e: unknown) {
    return { ok: false, error: blobUploadErrorMessage(e) };
  }
}

/** File.type이 비었을 때 확장자로 MIME 추정 (브라우저/OS에 따라 type이 빈 경우 있음) */
function guessContentTypeFromFile(file: File): string {
  const t = file.type?.trim();
  if (t) return t;
  const n = file.name.toLowerCase();
  if (n.endsWith('.png')) return 'image/png';
  if (n.endsWith('.webp')) return 'image/webp';
  if (n.endsWith('.gif')) return 'image/gif';
  if (n.endsWith('.jpg') || n.endsWith('.jpeg')) return 'image/jpeg';
  if (n.endsWith('.heic') || n.endsWith('.heif')) return 'image/heic';
  return 'image/jpeg';
}

/**
 * 서버에서 받은 이미지 바이너리(Google 포토 다운로드 등)를 공개 URL로 저장.
 * Vercel Blob과 Supabase 공개 버킷을 카드 업로드와 동일한 우선순위로 시도합니다.
 */
export async function uploadUserPhotoBufferWithFallback(
  buffer: Buffer,
  contentType: string,
  folder: 'records' | 'courses' | 'profiles' = 'records'
): Promise<UploadImageDetailedResult> {
  const { mime, ext } = resolveUploadMimeAndExt(buffer, contentType);

  if (isSupabaseCardBucketConfigured()) {
    const sup = await uploadImageBufferToSupabasePublic(buffer, folder, mime);
    if (sup.ok) {
      return sup;
    }
    const blob = await uploadBufferToVercelBlob(buffer, folder, mime, ext);
    if (blob.ok) {
      return blob;
    }
    return {
      ok: false,
      error: appendStorageEnvHint(`Supabase: ${sup.error} | Vercel Blob: ${blob.error}`),
    };
  }

  const blob = await uploadBufferToVercelBlob(buffer, folder, mime, ext);
  if (blob.ok) {
    return blob;
  }

  const sup = await uploadImageBufferToSupabasePublic(buffer, folder, mime);
  if (sup.ok) {
    return sup;
  }

  const quotaHint =
    /quota|exceeded|maximum/i.test(blob.error) && sup.error === 'SUPABASE_PUBLIC_CARD_BUCKET 미설정'
      ? ' Vercel Blob 용량 초과 시 Supabase에 공개 버킷을 만들고 SUPABASE_PUBLIC_CARD_BUCKET 환경 변수를 설정한 뒤 재배포하세요.'
      : '';

  const base =
    sup.error === 'SUPABASE_PUBLIC_CARD_BUCKET 미설정'
      ? `${blob.error}.${quotaHint}`
      : `${blob.error} | Supabase: ${sup.error}`;

  return {
    ok: false,
    error: appendStorageEnvHint(base),
  };
}

function appendStorageEnvHint(msg: string): string {
  const bucket = Boolean(process.env.SUPABASE_PUBLIC_CARD_BUCKET?.trim());
  const role = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
  const url = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim());
  if (bucket && !role) {
    return `${msg} [힌트] SUPABASE_PUBLIC_CARD_BUCKET만 있고 SUPABASE_SERVICE_ROLE_KEY가 없으면 Supabase 업로드가 비활성화됩니다.`;
  }
  if (bucket && role && !url) {
    return `${msg} [힌트] NEXT_PUBLIC_SUPABASE_URL이 필요합니다.`;
  }
  if (!hasBlobReadWriteToken() && !isSupabaseCardBucketConfigured()) {
    return `${msg} [힌트] BLOB_READ_WRITE_TOKEN 또는 (SUPABASE_SERVICE_ROLE_KEY + SUPABASE_PUBLIC_CARD_BUCKET + URL) 중 하나는 반드시 설정되어야 합니다.`;
  }
  return msg;
}

/**
 * Instagram 카드용 공개 URL 업로드.
 * - `SUPABASE_PUBLIC_CARD_BUCKET` 이 있으면 **Supabase를 먼저** 시도 (Hobby Blob 1GB 한도 회피).
 * - 없으면 Vercel Blob → 실패 시 Supabase 폴백.
 */
export async function uploadPublicJpegWithFallback(
  buffer: Buffer,
  folder: 'records' | 'courses' | 'profiles' = 'records'
): Promise<UploadImageDetailedResult> {
  if (isSupabaseCardBucketConfigured()) {
    const sup = await uploadInstagramCardToSupabase(buffer, folder);
    if (sup.ok) {
      return sup;
    }
    const blob = await uploadImageDetailed(buffer, folder);
    if (blob.ok) {
      return { ok: true, url: blob.url, storage: 'vercel-blob' };
    }
    return {
      ok: false,
      error: `Supabase: ${sup.error} | Vercel Blob: ${blob.error}`,
    };
  }

  const blob = await uploadImageDetailed(buffer, folder);
  if (blob.ok) {
    return { ok: true, url: blob.url, storage: 'vercel-blob' };
  }

  const sup = await uploadInstagramCardToSupabase(buffer, folder);
  if (sup.ok) {
    return sup;
  }

  const quotaHint =
    /quota|exceeded|maximum/i.test(blob.error) && sup.error === 'SUPABASE_PUBLIC_CARD_BUCKET 미설정'
      ? ' Vercel Blob 용량 초과 시 Supabase에 공개 버킷을 만들고 SUPABASE_PUBLIC_CARD_BUCKET 환경 변수를 설정한 뒤 재배포하세요.'
      : '';

  return {
    ok: false,
    error:
      sup.error === 'SUPABASE_PUBLIC_CARD_BUCKET 미설정'
        ? `${blob.error}.${quotaHint}`
        : `${blob.error} | Supabase: ${sup.error}`,
  };
}

/**
 * Vercel Blob 업로드 — 실패 시 원인 문자열 포함 (동기화 로그·UI용).
 */
export async function uploadImageDetailed(
  file: Buffer | File,
  folder: 'records' | 'courses' | 'profiles' = 'records'
): Promise<UploadImageDetailedResult> {
  if (!getBlobReadWriteToken()) {
    const msg =
      'BLOB_READ_WRITE_TOKEN 없음 — Vercel 프로젝트에 Blob Storage를 연결했는지 확인하세요 (Storage → Blob → Connect).';
    console.error('❌', msg);
    return { ok: false, error: msg };
  }

  try {
    console.log('📤 Vercel Blob 업로드 시작...');
    console.log('📤 폴더:', folder);

    let buffer: Buffer;
    let filename: string;
    let contentType: string;

    if (file instanceof File) {
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      filename = file.name;
      contentType = file.type;
      console.log('📤 파일명:', filename);
      console.log('📤 파일 타입:', contentType);
    } else {
      buffer = file;
      filename = `image-${Date.now()}.jpg`;
      contentType = 'image/jpeg';
    }

    console.log('📤 파일 크기:', buffer.length, 'bytes');

    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const extension = filename.split('.').pop() || 'jpg';
    const uniqueFilename = `${folder}/${timestamp}-${randomStr}.${extension}`;

    const token = getBlobReadWriteToken()!;
    const blob = await put(uniqueFilename, buffer, {
      access: 'public',
      contentType,
      token,
    });

    console.log('✅ Vercel Blob 업로드 성공:', blob.url);
    return { ok: true, url: blob.url, storage: 'vercel-blob' };
  } catch (error: unknown) {
    console.error('❌ Vercel Blob 업로드 실패:', error);
    const msg = blobUploadErrorMessage(error);
    console.error('❌ 오류 메시지:', msg);
    return { ok: false, error: msg };
  }
}

/**
 * 사용자·크론 등 공통 이미지 업로드.
 * `SUPABASE_PUBLIC_CARD_BUCKET` + 서비스 롤이 있으면 Supabase를 우선 사용하고,
 * 실패 시 Vercel Blob으로 폴백합니다 (반대 순서도 시도).
 * 예전처럼 Blob만 쓰면 `BLOB_READ_WRITE_TOKEN` 없을 때 전부 실패하던 문제를 줄입니다.
 */
export async function uploadImage(
  file: Buffer | File,
  folder: 'records' | 'courses' | 'profiles' = 'records'
): Promise<string | null> {
  let buffer: Buffer;
  let contentType: string;
  if (file instanceof File) {
    const arrayBuffer = await file.arrayBuffer();
    buffer = Buffer.from(new Uint8Array(arrayBuffer));
    contentType = guessContentTypeFromFile(file);
  } else {
    buffer = file;
    contentType = 'image/jpeg';
  }
  const r = await uploadUserPhotoBufferWithFallback(buffer, contentType, folder);
  return r.ok ? r.url : null;
}

/** `uploadImage`와 동일 경로이나 실패 시 원인 문자열을 받을 때 사용 */
export async function uploadImageWithFallbackDetailed(
  file: Buffer | File,
  folder: 'records' | 'courses' | 'profiles' = 'records'
): Promise<UploadImageDetailedResult> {
  let buffer: Buffer;
  let contentType: string;
  if (file instanceof File) {
    const arrayBuffer = await file.arrayBuffer();
    buffer = Buffer.from(new Uint8Array(arrayBuffer));
    contentType = guessContentTypeFromFile(file);
  } else {
    buffer = file;
    contentType = 'image/jpeg';
  }
  return uploadUserPhotoBufferWithFallback(buffer, contentType, folder);
}

/**
 * 배포 후 이미지 업로드 실패 원인 점검용 (비밀 값은 노출하지 않음).
 * 브라우저에서 `/api/health/storage` 로 확인하세요.
 */
export function getImageStorageEnvSummary() {
  const bucket = Boolean(process.env.SUPABASE_PUBLIC_CARD_BUCKET?.trim());
  const serviceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
  const supabaseUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim());
  const anon = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim());
  const blobToken = hasBlobReadWriteToken();
  const adminReady = Boolean(supabaseAdmin);
  const supabaseStorageReady = bucket && serviceRole && supabaseUrl && adminReady;

  const recommendations: string[] = [];
  if (!blobToken && !supabaseStorageReady) {
    recommendations.push(
      'Vercel 환경 변수: BLOB_READ_WRITE_TOKEN 을 추가하거나, Supabase 서비스 롤 + 공개 버킷 이름을 설정하세요.'
    );
  }
  if (bucket && !serviceRole) {
    recommendations.push(
      'SUPABASE_PUBLIC_CARD_BUCKET 은 설정됐지만 SUPABASE_SERVICE_ROLE_KEY 가 없습니다. Supabase 대시보드 → Settings → API 의 service_role 키를 Vercel에 추가하세요.'
    );
  }
  if (serviceRole && supabaseUrl && !bucket) {
    recommendations.push(
      '스토리지용 공개 버킷 이름을 SUPABASE_PUBLIC_CARD_BUCKET 에 넣으세요 (버킷 이름만, URL 아님).'
    );
  }

  return {
    vercelBlob: { readWriteTokenSet: blobToken },
    supabase: {
      nextPublicUrlSet: supabaseUrl,
      anonKeySet: anon,
      serviceRoleKeySet: serviceRole,
      publicCardBucketSet: bucket,
      adminClientReady: adminReady,
      storageUploadReady: supabaseStorageReady,
    },
    atLeastOneBackendReady: blobToken || supabaseStorageReady,
    recommendations,
  };
}

/**
 * 저장된 이미지 URL 삭제 — Vercel Blob 또는 `SUPABASE_PUBLIC_CARD_BUCKET` 공개 객체
 */
export async function deleteImage(imageUrl: string): Promise<boolean> {
  try {
    if (imageUrl.includes('blob.vercel-storage.com')) {
      console.log('🗑️ Vercel Blob 이미지 삭제 시도:', imageUrl);
      await del(imageUrl);
      console.log('✅ Vercel Blob 이미지 삭제 성공');
      return true;
    }

    const bucket = process.env.SUPABASE_PUBLIC_CARD_BUCKET?.trim();
    if (bucket && supabaseAdmin) {
      const marker = `/object/public/${bucket}/`;
      const u = new URL(imageUrl);
      const idx = u.pathname.indexOf(marker);
      if (idx !== -1) {
        let objectPath = u.pathname.slice(idx + marker.length);
        if (objectPath) {
          objectPath = decodeURIComponent(objectPath);
          const { error } = await supabaseAdmin.storage.from(bucket).remove([objectPath]);
          if (error) {
            console.error('❌ Supabase 이미지 삭제 실패:', error.message);
            return false;
          }
          console.log('✅ Supabase 이미지 삭제 성공');
          return true;
        }
      }
    }

    console.log('⚠️ 지원하지 않는 이미지 URL 형식(삭제 생략):', imageUrl.slice(0, 96));
    return false;
  } catch (error: unknown) {
    console.error('❌ 이미지 삭제 실패:', error);
    return false;
  }
}
