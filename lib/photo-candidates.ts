/**
 * 사진 자동 선택 후보 누적 저장소.
 *
 * iPhone 단축어가 사진을 한 요청에 여러 장 보내든, 한 장씩 여러 요청으로
 * 보내든 상관없이 그날의 후보를 누적해 두고, 요청이 올 때마다 전체 후보 중
 * 자연 사진 1장을 다시 선별할 수 있게 한다.
 *
 * 저장소: Supabase 비공개 버킷(runlog-data) photos-candidates/{userId}/{date}/
 */

import { supabaseAdmin } from '@/lib/supabase';

const BUCKET = 'runlog-data';
const MAX_CANDIDATES = 12;

async function ensureBucket(): Promise<void> {
  if (!supabaseAdmin) throw new Error('Supabase admin client not initialized');
  const { error } = await supabaseAdmin.storage.getBucket(BUCKET);
  if (error) {
    await supabaseAdmin.storage.createBucket(BUCKET, { public: false });
  }
}

function dirFor(userId: number, dateStr: string): string {
  return `photos-candidates/${userId}/${dateStr}`;
}

/** 새 후보 사진들을 저장 (그날 폴더에 추가). */
export async function saveCandidatePhotos(
  userId: number,
  dateStr: string,
  photos: { buffer: Buffer; mimeType: string }[]
): Promise<void> {
  if (!supabaseAdmin) throw new Error('Supabase admin client not initialized');
  await ensureBucket();
  const base = Date.now();
  for (let i = 0; i < photos.length; i++) {
    const ext = photos[i].mimeType === 'image/png' ? 'png' : 'jpg';
    await supabaseAdmin.storage
      .from(BUCKET)
      .upload(`${dirFor(userId, dateStr)}/${base}-${i}.${ext}`, photos[i].buffer, {
        contentType: photos[i].mimeType,
        upsert: true,
      });
  }
}

/** 그날의 후보 전체를 로드 (오래된 순, 최대 MAX_CANDIDATES). */
export async function loadCandidatePhotos(
  userId: number,
  dateStr: string
): Promise<{ buffer: Buffer; mimeType: string }[]> {
  if (!supabaseAdmin) return [];
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .list(dirFor(userId, dateStr), { limit: MAX_CANDIDATES, sortBy: { column: 'name', order: 'asc' } });
  if (error || !data) return [];

  const out: { buffer: Buffer; mimeType: string }[] = [];
  for (const f of data) {
    const { data: blob } = await supabaseAdmin.storage
      .from(BUCKET)
      .download(`${dirFor(userId, dateStr)}/${f.name}`);
    if (blob) {
      out.push({
        buffer: Buffer.from(await blob.arrayBuffer()),
        mimeType: f.name.endsWith('.png') ? 'image/png' : 'image/jpeg',
      });
    }
  }
  return out;
}
