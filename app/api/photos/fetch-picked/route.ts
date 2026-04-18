import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/** Google 포토 픽커가 돌려준 공개 URL만 프록시 (오픈 프록시 방지) */
function isAllowedPickedImageUrl(urlStr: string): boolean {
  try {
    const u = new URL(urlStr);
    if (u.protocol !== 'https:') return false;
    const h = u.hostname.toLowerCase();
    if (h.endsWith('.public.blob.vercel-storage.com')) return true;
    if (h.endsWith('.supabase.co') && u.pathname.includes('/storage/v1/object/public/')) return true;
    return false;
  } catch {
    return false;
  }
}

/**
 * 브라우저 CORS 없이 픽커 결과 이미지를 가져오기 위한 동일 출처 프록시.
 * POST JSON: { url: string }
 */
export async function POST(request: NextRequest) {
  const userId = getUserIdFromRequest();
  if (!userId) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON 본문이 필요합니다.' }, { status: 400 });
  }

  const url =
    typeof body === 'object' &&
    body !== null &&
    'url' in body &&
    typeof (body as { url: unknown }).url === 'string'
      ? (body as { url: string }).url.trim()
      : '';

  if (!url || !isAllowedPickedImageUrl(url)) {
    return NextResponse.json({ error: '허용되지 않은 이미지 주소입니다.' }, { status: 400 });
  }

  try {
    const upstream = await fetch(url, { redirect: 'follow' });
    if (!upstream.ok) {
      return NextResponse.json(
        { error: `저장소에서 이미지를 불러오지 못했습니다. (${upstream.status})` },
        { status: 502 }
      );
    }
    if (!upstream.body) {
      return NextResponse.json({ error: '이미지 응답 본문이 없습니다.' }, { status: 502 });
    }

    const ct = upstream.headers.get('content-type') || 'image/jpeg';
    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': ct,
        'Cache-Control': 'private, max-age=120',
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : '이미지를 불러오지 못했습니다.';
    console.error('[POST /api/photos/fetch-picked]', msg);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
