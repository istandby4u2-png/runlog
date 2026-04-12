import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import {
  type PickedMediaItem,
  refreshAccessToken,
  createPickerSession,
  getPickerSession,
  listPickedMediaItems,
  downloadPhotoAsBuffer,
  deletePickerSession,
  PickerListNotReadyError,
  PickerListSessionNotFoundError,
} from '@/lib/google-photos-api';
import { userTokens, pickedPhotos } from '@/lib/db-supabase';
import { uploadImage } from '@/lib/blob-storage';

export const dynamic = 'force-dynamic';

/**
 * POST /api/photos/picker
 * Create a new Picker session → returns { sessionId, pickerUri }
 */
export async function POST(request: NextRequest) {
  const userId = getUserIdFromRequest();
  if (!userId) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as { date?: string };
    const photoDate = body.date || new Date(
      new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' })
    ).toISOString().slice(0, 10);

    const gpToken = await userTokens.findByProvider(userId, 'google_photos');
    if (!gpToken?.refresh_token) {
      return NextResponse.json(
        { error: 'Google Photos가 연결되어 있지 않습니다. Settings에서 먼저 연결해주세요.' },
        { status: 400 }
      );
    }

    const { access_token } = await refreshAccessToken(gpToken.refresh_token);
    await userTokens.upsert({
      user_id: userId,
      provider: 'google_photos',
      access_token,
      refresh_token: gpToken.refresh_token,
      token_expires_at: new Date(Date.now() + 3500 * 1000).toISOString(),
    });

    const session = await createPickerSession(access_token);

    return NextResponse.json({
      sessionId: session.id,
      pickerUri: session.pickerUri,
      photoDate,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Picker 세션 생성 중 오류가 발생했습니다.';
    console.error('[POST /api/photos/picker]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/**
 * GET /api/photos/picker?sessionId=xxx&date=YYYY-MM-DD
 * Poll session status. If mediaItemsSet=true, download first photo and store it.
 */
export async function GET(request: NextRequest) {
  const userId = getUserIdFromRequest();
  if (!userId) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const sp = request.nextUrl.searchParams;
  const sessionId = sp.get('sessionId')?.trim() ?? '';
  const photoDate = sp.get('date')?.trim() ?? '';

  if (!sessionId || !photoDate) {
    return NextResponse.json(
      { error: 'sessionId and date query params required' },
      { status: 400 }
    );
  }

  try {
    const gpToken = await userTokens.findByProvider(userId, 'google_photos');
    if (!gpToken?.refresh_token) {
      return NextResponse.json(
        { error: 'Google Photos가 연결되어 있지 않습니다. Settings에서 먼저 연결해주세요.' },
        { status: 400 }
      );
    }

    // POST와 동일하게 매 폴링마다 갱신 — DB에 남은 액세스 토큰과 세션 생성 시 토큰이 어긋나 404가 나는 경우 방지
    const { access_token: accessToken } = await refreshAccessToken(gpToken.refresh_token);
    await userTokens.upsert({
      user_id: userId,
      provider: 'google_photos',
      access_token: accessToken,
      refresh_token: gpToken.refresh_token,
      token_expires_at: new Date(Date.now() + 3500 * 1000).toISOString(),
    });

    // 공식 가이드: 선택 완료 후 sessions.get 이 먼저 사라질 수 있음 → mediaItems.list 를 우선 시도
    let items: PickedMediaItem[];
    try {
      items = await listPickedMediaItems(accessToken, sessionId);
    } catch (e) {
      if (e instanceof PickerListNotReadyError) {
        const session = await getPickerSession(accessToken, sessionId);
        if (session?.mediaItemsSet === true) {
          items = await listPickedMediaItems(accessToken, sessionId);
        } else {
          return NextResponse.json({
            status: 'waiting',
            pollingConfig: session?.pollingConfig,
          });
        }
      } else if (e instanceof PickerListSessionNotFoundError) {
        const session = await getPickerSession(accessToken, sessionId);
        if (session?.mediaItemsSet === true) {
          items = await listPickedMediaItems(accessToken, sessionId);
        } else {
          return NextResponse.json(
            {
              error:
                '피커 세션을 찾을 수 없습니다. RunLog에 연결한 Google 계정과 피커를 연 브라우저의 Google 계정이 같은지 확인한 뒤 다시 시도해 주세요.',
              code: 'PICKER_SESSION_NOT_FOUND',
            },
            { status: 410 }
          );
        }
      } else {
        throw e;
      }
    }
    if (items.length === 0) {
      return NextResponse.json({ status: 'empty', message: '사진이 선택되지 않았습니다.' });
    }

    const firstPhoto = items.find((i) => i.type === 'PHOTO') || items[0];
    const { buffer } = await downloadPhotoAsBuffer(
      firstPhoto.mediaFile.baseUrl,
      accessToken
    );
    const blobUrl = await uploadImage(buffer, 'records');

    if (!blobUrl) {
      return NextResponse.json({ error: '사진 업로드에 실패했습니다.' }, { status: 500 });
    }

    await pickedPhotos.upsert(userId, photoDate, blobUrl);

    await deletePickerSession(accessToken, sessionId).catch(() => {});

    return NextResponse.json({
      status: 'done',
      photoDate,
      blobUrl,
      totalPicked: items.length,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Picker 폴링 중 오류가 발생했습니다.';
    console.error('[GET /api/photos/picker]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
