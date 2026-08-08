/**
 * 날짜별 Instagram 게시 완료 표식.
 *
 * 사진이 없는 날은 IG 게시를 «보류»하고(사이트 기록만 생성), 사진이 도착한 뒤
 * 다음 크론이 밀린 날을 게시한다. 이때 같은 날을 두 번 올리지 않으려면
 * «이미 게시했는가»를 알아야 하는데, running_records에는 해당 컬럼이 없다.
 * DB 마이그레이션 없이 동작하도록 Supabase Storage 비공개 버킷에 표식을 남긴다
 * (ingested-workouts와 같은 방식).
 */

import { supabaseAdmin } from '@/lib/supabase';

const BUCKET = 'runlog-data';

function pathFor(userId: number, dateStr: string): string {
  return `ig-published/${userId}/${dateStr}.json`;
}

/** 그 날짜를 이미 Instagram에 게시했는지. 조회 실패 시 true(=게시함)로 보아 중복 게시를 막는다. */
export async function isIgPublished(
  userId: number,
  dateStr: string
): Promise<boolean> {
  if (!supabaseAdmin) return true;
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .download(pathFor(userId, dateStr));
  if (error) {
    // 파일 없음(정상적인 «미게시») 외의 오류도 여기로 오지만,
    // 잘못 게시하는 쪽보다 건너뛰는 쪽이 안전하므로 not-found만 false로 본다.
    const msg = (error.message || '').toLowerCase();
    const notFound =
      msg.includes('not found') || msg.includes('nosuchkey') || msg.includes('404');
    return !notFound;
  }
  return !!data;
}

/** 게시 완료 표식 기록 (실패해도 게시 자체는 성공이므로 예외를 던지지 않는다). */
export async function markIgPublished(
  userId: number,
  dateStr: string,
  igMediaId: string | null
): Promise<void> {
  if (!supabaseAdmin) return;
  const body = Buffer.from(
    JSON.stringify({ igMediaId, publishedAt: new Date().toISOString() }, null, 2)
  );
  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(pathFor(userId, dateStr), body, {
      contentType: 'application/json',
      upsert: true,
    });
  if (error) {
    console.warn(`ig-published 표식 저장 실패 (${dateStr}): ${error.message}`);
  }
}
