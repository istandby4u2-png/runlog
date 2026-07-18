import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { getUserIdFromRequest } from '@/lib/auth';
import { selectNaturePhoto } from '@/lib/gemini';
import { uploadUserPhotoBufferWithFallback } from '@/lib/blob-storage';
import { pickedPhotos } from '@/lib/db-supabase';
import {
  saveCandidatePhotos,
  loadCandidatePhotos,
} from '@/lib/photo-candidates';

const AUTO_SYNC_USER_ID = parseInt(process.env.AUTO_SYNC_USER_ID || '0', 10);
const CRON_SECRET = process.env.CRON_SECRET;

const MAX_PHOTOS = 10;
const MAX_BYTES_PER_PHOTO = 4 * 1024 * 1024;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

/**
 * POST /api/photos/auto-select
 *
 * iPhone 단축어(매일 20:50 자동 실행)가 오늘 찍은 사진들을 multipart로 올리면
 * Gemini Vision이 자연 사진 1장을 선별해 picked_photos에 저장합니다.
 * 21:00 daily-sync가 이 사진을 카드 배경으로 사용합니다.
 *
 * 인증: Authorization: Bearer ${CRON_SECRET} (단축어) 또는 로그인 세션.
 * 필드: photos (이미지 여러 개, JPEG/PNG/WebP — HEIC은 단축어에서 JPEG 변환 필요),
 *       date (선택, YYYY-MM-DD, 기본 KST 오늘)
 */
export async function POST(request: NextRequest) {
  const bearerOk =
    !!CRON_SECRET &&
    request.headers.get('authorization') === `Bearer ${CRON_SECRET}`;
  const sessionUserId = getUserIdFromRequest();

  let userId: number;
  if (bearerOk) {
    if (!AUTO_SYNC_USER_ID) {
      return NextResponse.json(
        { error: 'AUTO_SYNC_USER_ID not configured' },
        { status: 500 }
      );
    }
    userId = AUTO_SYNC_USER_ID;
  } else if (sessionUserId) {
    userId = sessionUserId;
  } else {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: 'multipart/form-data 요청이 필요합니다.' },
      { status: 400 }
    );
  }

  const dateField = form.get('date');
  const kstToday = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' })
  ).toISOString().slice(0, 10);
  const dateStr =
    typeof dateField === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateField)
      ? dateField
      : kstToday;

  // 'photos' 필드 우선, 없으면 폼의 모든 파일 항목 수집 (단축어 필드명 실수 대비)
  let files = form.getAll('photos').filter((v): v is File => v instanceof File);
  if (files.length === 0) {
    files = [...form.entries()]
      .map(([, v]) => v)
      .filter((v): v is File => v instanceof File);
  }
  if (files.length === 0) {
    return NextResponse.json(
      { error: '사진 파일이 없습니다. photos 필드로 이미지를 첨부해 주세요.' },
      { status: 400 }
    );
  }

  const skipped: string[] = [];
  const images: { buffer: Buffer; mimeType: string; name: string }[] = [];
  for (const file of files.slice(0, MAX_PHOTOS)) {
    const mime = file.type || 'application/octet-stream';
    if (!ALLOWED_MIME.has(mime)) {
      skipped.push(`${file.name}: 지원하지 않는 형식(${mime}) — 단축어에서 JPEG로 변환해 주세요`);
      continue;
    }
    if (file.size > MAX_BYTES_PER_PHOTO) {
      skipped.push(`${file.name}: 4MB 초과 — 단축어에서 이미지 크기를 줄여 주세요`);
      continue;
    }
    images.push({
      buffer: Buffer.from(await file.arrayBuffer()),
      mimeType: mime,
      name: file.name,
    });
  }

  if (images.length === 0) {
    return NextResponse.json(
      { error: '사용할 수 있는 사진이 없습니다.', skipped },
      { status: 400 }
    );
  }

  // 오늘의 후보에 누적 — 단축어가 한 장씩 여러 요청으로 보내도 전체 중에서 선별
  let candidates: { buffer: Buffer; mimeType: string }[] = images;
  try {
    await saveCandidatePhotos(userId, dateStr, images);
    const all = await loadCandidatePhotos(userId, dateStr);
    if (all.length > images.length) candidates = all;
  } catch (err) {
    console.warn(
      'auto-select: 후보 누적 실패, 이번 요청 사진만 사용',
      err instanceof Error ? err.message : err
    );
  }

  // Gemini로 자연 사진 선별 (실패 시 첫 번째 사진 폴백)
  const selection = await selectNaturePhoto(
    candidates.map(({ buffer, mimeType }) => ({ buffer, mimeType }))
  );
  const index = selection?.index ?? 0;
  const reason = selection?.reason ?? 'AI 선별 실패 — 첫 번째 사진 사용';
  const chosen = candidates[index];

  // EXIF 회전을 픽셀에 반영 (satori 카드 생성기는 EXIF orientation을 무시함)
  let normalized = chosen.buffer;
  let normalizedMime = chosen.mimeType;
  try {
    normalized = await sharp(chosen.buffer)
      .rotate()
      .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 88 })
      .toBuffer();
    normalizedMime = 'image/jpeg';
  } catch (err) {
    console.warn(
      'auto-select: 이미지 정규화 실패, 원본 사용',
      err instanceof Error ? err.message : err
    );
  }

  const uploaded = await uploadUserPhotoBufferWithFallback(
    normalized,
    normalizedMime,
    'records'
  );
  if (!uploaded.ok) {
    return NextResponse.json(
      { error: `사진 업로드 실패: ${uploaded.error}` },
      { status: 500 }
    );
  }

  await pickedPhotos.upsert(userId, dateStr, uploaded.url);

  return NextResponse.json({
    ok: true,
    date: dateStr,
    newPhotos: images.length,
    candidates: candidates.length,
    selectedIndex: index,
    reason,
    blobUrl: uploaded.url,
    skipped: skipped.length > 0 ? skipped : undefined,
  });
}
