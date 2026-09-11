/**
 * 날짜별 «함께 뛴 사람» 멘션 표식.
 *
 * 애플 피트니스의 공유 친구 활동은 HealthKit·Health Auto Export·Garmin 어디에도
 * 들어오지 않아 서버가 스스로 «오늘 같이 뛰었다»를 알 수 없다. 그래서 사용자가
 * 그날만 켜 두면 캡션에 «w. @핸들»이 붙는 수동 표식으로 둔다.
 *
 * 저장 위치는 ig-published와 같은 방식(비공개 버킷의 JSON 파일)이라
 * DB 마이그레이션이 필요 없다.
 */

import { supabaseAdmin } from '@/lib/supabase';

const BUCKET = 'runlog-data';
/** 핸들을 매번 넘기지 않아도 되도록 마지막에 쓴 값을 기본값으로 보관 */
const DEFAULT_KEY = '_default';

function dirFor(userId: number): string {
  return `companion/${userId}`;
}

function pathFor(userId: number, key: string): string {
  return `${dirFor(userId)}/${key}.json`;
}

async function readMention(userId: number, key: string): Promise<string | null> {
  if (!supabaseAdmin) return null;

  // 존재 확인은 list로 — download는 «파일 없음»을 본문 없는 에러로 돌려주는 경우가
  // 있어 오판하기 쉽다(ig-published에서 실제로 겪은 문제).
  const { data: listed, error: listErr } = await supabaseAdmin.storage
    .from(BUCKET)
    .list(dirFor(userId), { search: `${key}.json`, limit: 100 });
  if (listErr) return null;
  if (!(listed || []).some((o) => o.name === `${key}.json`)) return null;

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .download(pathFor(userId, key));
  if (error || !data) return null;
  try {
    const parsed = JSON.parse(await data.text()) as { mention?: unknown };
    const mention = typeof parsed.mention === 'string' ? parsed.mention.trim() : '';
    return mention || null;
  } catch {
    return null;
  }
}

async function writeMention(
  userId: number,
  key: string,
  mention: string
): Promise<void> {
  if (!supabaseAdmin) return;
  const body = Buffer.from(
    JSON.stringify({ mention, updatedAt: new Date().toISOString() }, null, 2)
  );
  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(pathFor(userId, key), body, {
      contentType: 'application/json',
      upsert: true,
    });
  if (error) {
    throw new Error(`멘션 표식 저장 실패 (${key}): ${error.message}`);
  }
}

/** 그날 캡션에 붙일 멘션. 켜 두지 않았으면 null. */
export async function getCompanionMention(
  userId: number,
  dateStr: string
): Promise<string | null> {
  return readMention(userId, dateStr);
}

/** 마지막에 쓴 핸들(기본값). 토글할 때 핸들을 생략하면 이 값을 쓴다. */
export async function getDefaultMention(userId: number): Promise<string | null> {
  return readMention(userId, DEFAULT_KEY);
}

/**
 * 그날 멘션을 켠다. mention을 생략하면 기본값을 쓰고,
 * 주면 그 값을 기본값으로도 갱신한다.
 * @returns 실제로 켜진 멘션 문자열
 */
export async function setCompanionMention(
  userId: number,
  dateStr: string,
  mention?: string | null
): Promise<string> {
  const explicit = (mention || '').trim();
  const value = explicit || (await getDefaultMention(userId)) || '';
  if (!value) {
    throw new Error(
      '멘션 문자열이 없습니다. 처음 한 번은 mention을 함께 보내 주세요 (예: "@handle").'
    );
  }
  await writeMention(userId, dateStr, value);
  if (explicit) await writeMention(userId, DEFAULT_KEY, explicit);
  return value;
}

/** 그날 멘션을 끈다. 켜져 있지 않았어도 오류가 아니다. */
export async function clearCompanionMention(
  userId: number,
  dateStr: string
): Promise<void> {
  if (!supabaseAdmin) return;
  await supabaseAdmin.storage.from(BUCKET).remove([pathFor(userId, dateStr)]);
}
