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

function dirFor(userId: number): string {
  return `ig-published/${userId}`;
}

function pathFor(userId: number, dateStr: string): string {
  return `${dirFor(userId)}/${dateStr}.json`;
}

/**
 * 게시 여부 판정과 «그렇게 판정한 이유».
 *
 * isIgPublished는 «게시함»으로 몰아주는 보수적 판정이라, 표식이 실제로 있어서
 * 건너뛴 것인지 조회가 실패해서 건너뛴 것인지 구분이 안 된다. 밀린 게시가
 * 조용히 아무것도 안 할 때 원인을 알려면 이 이유가 필요하다.
 */
export type IgPublishedCheck = {
  published: boolean;
  /** marker=표식 있음, none=미게시, no-admin=관리자 클라이언트 없음, error=조회 실패 */
  reason: 'marker' | 'none' | 'no-admin' | 'error';
  detail?: string;
};

export async function checkIgPublished(
  userId: number,
  dateStr: string
): Promise<IgPublishedCheck> {
  if (!supabaseAdmin) {
    return { published: true, reason: 'no-admin' };
  }

  // 존재 확인은 download()가 아니라 list()로 한다.
  // download()는 «파일 없음»을 에러로 돌려주는데, 그 에러 본문이 비어 있는 경우가
  // 있어(메시지가 "{}") not-found 문자열 매칭이 걸리지 않는다. 그러면 보수적 판정이
  // «이미 게시함»으로 기울어 밀린 게시가 조용히 멈춘다(2026-09-08·09 실제 사례).
  // list()는 없는 파일을 에러가 아니라 «빈 배열»로 돌려주므로 추측이 필요 없다.
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .list(dirFor(userId), { search: `${dateStr}.json`, limit: 100 });

  if (error) {
    // 진짜 조회 실패 — 잘못 게시하는 쪽보다 건너뛰는 쪽이 안전하다.
    return {
      published: true,
      reason: 'error',
      detail: error.message || JSON.stringify(error),
    };
  }

  const found = (data || []).some((o) => o.name === `${dateStr}.json`);
  return found
    ? { published: true, reason: 'marker' }
    : { published: false, reason: 'none' };
}

/** 그 날짜를 이미 Instagram에 게시했는지. 조회 실패 시 true(=게시함)로 보아 중복 게시를 막는다. */
export async function isIgPublished(
  userId: number,
  dateStr: string
): Promise<boolean> {
  const { published } = await checkIgPublished(userId, dateStr);
  return published;
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
