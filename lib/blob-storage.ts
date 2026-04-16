import { put, del } from '@vercel/blob';
import { supabaseAdmin } from '@/lib/supabase';

export type UploadImageDetailedResult =
  | { ok: true; url: string; storage?: 'vercel-blob' | 'supabase' }
  | { ok: false; error: string };

function blobUploadErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}

/**
 * Instagram 카드용 공개 URL 업로드 — Vercel Blob 실패 시 Supabase Storage(옵션)로 폴백.
 * Supabase: 대시보드에서 **공개 읽기** 버킷을 만들고 `SUPABASE_PUBLIC_CARD_BUCKET`에 버킷 이름 설정.
 */
export async function uploadPublicJpegWithFallback(
  buffer: Buffer,
  folder: 'records' | 'courses' | 'profiles' = 'records'
): Promise<UploadImageDetailedResult> {
  const blob = await uploadImageDetailed(buffer, folder);
  if (blob.ok) {
    return { ok: true, url: blob.url, storage: 'vercel-blob' };
  }

  const bucket = process.env.SUPABASE_PUBLIC_CARD_BUCKET?.trim();
  if (!bucket || !supabaseAdmin) {
    return {
      ok: false,
      error: blob.error,
    };
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
      return {
        ok: false,
        error: `${blob.error} | Supabase Storage: ${error.message}`,
      };
    }
    const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path);
    if (!data?.publicUrl) {
      return {
        ok: false,
        error: `${blob.error} | Supabase: public URL 없음`,
      };
    }
    return { ok: true, url: data.publicUrl, storage: 'supabase' };
  } catch (e: unknown) {
    return {
      ok: false,
      error: `${blob.error} | Supabase: ${blobUploadErrorMessage(e)}`,
    };
  }
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
    return { ok: true, url: blob.url, storage: 'vercel-blob' };
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
