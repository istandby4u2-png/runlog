import { put, del } from '@vercel/blob';

export type UploadImageDetailedResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

function blobUploadErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

/**
 * Vercel Blob 업로드 — 실패 시 원인 문자열 포함 (동기화 로그·UI용).
 */
export async function uploadImageDetailed(
  file: Buffer | File,
  folder: 'records' | 'courses' | 'profiles' = 'records'
): Promise<UploadImageDetailedResult> {
  if (!process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
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

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    const blob = await put(uniqueFilename, buffer, {
      access: 'public',
      contentType,
      token,
    });

    console.log('✅ Vercel Blob 업로드 성공:', blob.url);
    return { ok: true, url: blob.url };
  } catch (error: unknown) {
    console.error('❌ Vercel Blob 업로드 실패:', error);
    const msg = blobUploadErrorMessage(error);
    console.error('❌ 오류 메시지:', msg);
    return { ok: false, error: msg };
  }
}

/**
 * 이미지를 Vercel Blob Storage에 업로드
 * @param file 이미지 파일 (Buffer 또는 File)
 * @param folder Blob 폴더 경로 (예: 'records', 'courses', 'profiles')
 * @returns 업로드된 이미지 URL
 */
export async function uploadImage(
  file: Buffer | File,
  folder: 'records' | 'courses' | 'profiles' = 'records'
): Promise<string | null> {
  const r = await uploadImageDetailed(file, folder);
  return r.ok ? r.url : null;
}

/**
 * Vercel Blob Storage에서 이미지 삭제
 * @param imageUrl 삭제할 이미지 URL
 */
export async function deleteImage(imageUrl: string): Promise<boolean> {
  try {
    // Vercel Blob URL 형식: https://[account].public.blob.vercel-storage.com/[path]
    if (!imageUrl.includes('blob.vercel-storage.com')) {
      console.log('⚠️ Vercel Blob URL이 아닙니다. 삭제하지 않습니다.');
      return false;
    }

    console.log('🗑️ Vercel Blob 이미지 삭제 시도:', imageUrl);
    
    await del(imageUrl);
    
    console.log('✅ Vercel Blob 이미지 삭제 성공');
    return true;
  } catch (error: any) {
    console.error('❌ Vercel Blob 이미지 삭제 실패:', error);
    console.error('❌ 오류 메시지:', error?.message);
    return false;
  }
}
