import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import {
  getCompanionMention,
  getDefaultMention,
  setCompanionMention,
  clearCompanionMention,
} from '@/lib/companion-mention';

const AUTO_SYNC_USER_ID = parseInt(process.env.AUTO_SYNC_USER_ID || '0', 10);
const CRON_SECRET = process.env.CRON_SECRET;

export const dynamic = 'force-dynamic';

/**
 * 함께 뛴 사람 멘션 토글.
 *
 * 애플 피트니스의 공유 친구 활동은 서버에서 읽을 방법이 없어(HealthKit·HAE·Garmin
 * 어디에도 안 들어옴) 자동 감지가 불가능하다. 그래서 함께 뛴 날만 켜 두면 그날
 * Instagram 캡션에 «w. @핸들»이 붙는다.
 *
 *   GET  /api/workouts/companion                 → 오늘 상태 조회
 *   GET  /api/workouts/companion?date=2026-09-12 → 그 날짜 상태 조회
 *   POST /api/workouts/companion {"mention":"@handle"}  → 오늘 켜기(+기본값 갱신)
 *   POST /api/workouts/companion {}                     → 오늘 켜기(기본값 사용)
 *   POST /api/workouts/companion {"off":true}           → 오늘 끄기
 *
 * 인증: Authorization: Bearer ${CRON_SECRET} 또는 로그인 세션.
 */
function resolveUserId(request: NextRequest): number | null {
  const bearerOk =
    !!CRON_SECRET &&
    request.headers.get('authorization') === `Bearer ${CRON_SECRET}`;
  if (bearerOk) return AUTO_SYNC_USER_ID || null;
  return getUserIdFromRequest();
}

function kstToday(): string {
  return new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' })
  )
    .toISOString()
    .slice(0, 10);
}

function resolveDate(raw: unknown): string | null {
  if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.trim())) {
    return raw.trim();
  }
  return raw == null || raw === '' ? kstToday() : null;
}

export async function GET(request: NextRequest) {
  const userId = resolveUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const dateStr = resolveDate(request.nextUrl.searchParams.get('date'));
  if (!dateStr) {
    return NextResponse.json(
      { error: 'date는 YYYY-MM-DD 형식이어야 합니다.' },
      { status: 400 }
    );
  }
  const [mention, fallback] = await Promise.all([
    getCompanionMention(userId, dateStr),
    getDefaultMention(userId),
  ]);
  return NextResponse.json({
    ok: true,
    date: dateStr,
    on: mention != null,
    mention,
    defaultMention: fallback,
  });
}

export async function POST(request: NextRequest) {
  const userId = resolveUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { date?: unknown; mention?: unknown; off?: unknown } = {};
  try {
    const text = await request.text();
    if (text.trim()) body = JSON.parse(text);
  } catch {
    return NextResponse.json(
      { error: 'JSON body를 읽지 못했습니다.' },
      { status: 400 }
    );
  }

  const dateStr = resolveDate(body.date);
  if (!dateStr) {
    return NextResponse.json(
      { error: 'date는 YYYY-MM-DD 형식이어야 합니다.' },
      { status: 400 }
    );
  }

  if (body.off === true) {
    await clearCompanionMention(userId, dateStr);
    return NextResponse.json({ ok: true, date: dateStr, on: false });
  }

  const raw = typeof body.mention === 'string' ? body.mention.trim() : '';
  // 인스타 핸들은 공백을 가질 수 없다 — «@keunpyung lee»처럼 표시 이름을 그대로
  // 넣으면 멘션이 걸리지 않으므로 미리 막는다. (핸들이 아닌 일반 텍스트를 쓰고
  // 싶으면 @ 없이 보내면 된다.)
  if (raw.startsWith('@') && /\s/.test(raw)) {
    return NextResponse.json(
      {
        error:
          '인스타그램 핸들에는 공백이 들어갈 수 없습니다. instagram.com/○○○ 의 ○○○를 @와 함께 보내 주세요.',
      },
      { status: 400 }
    );
  }

  try {
    const mention = await setCompanionMention(userId, dateStr, raw || null);
    return NextResponse.json({ ok: true, date: dateStr, on: true, mention });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 400 }
    );
  }
}
