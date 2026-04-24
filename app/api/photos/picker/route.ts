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
  GOOGLE_RECONNECT_MESSAGE,
  isGoogleOauthResponseRevokedErrorMessage,
  isGoogleRefreshTokenInvalidError,
} from '@/lib/google-photos-api';
import { userTokens, pickedPhotos, googlePickerSessions } from '@/lib/db-supabase';
import { uploadUserPhotoBufferWithFallback } from '@/lib/blob-storage';
import { rfc3339ToKstYmd } from '@/lib/kst-calendar';

export const dynamic = 'force-dynamic';

/** 사진 다운로드·Blob 업로드 반복 — Vercel에서 충분한 실행 시간 확보 */
export const maxDuration = 300;

/** 한 세션에서 처리할 사진 상한 (타임아웃 방지) */
const MAX_BATCH_PHOTOS = 120;

/** Picker 세션은 생성 직후의 액세스 토큰과 함께 쓰이는 경우가 있어, 폴링마다 refresh 하면 NOT_FOUND 가 날 수 있음 */
const ACCESS_TOKEN_REFRESH_IF_EXPIRES_WITHIN_MS = 120_000;

async function clearGooglePhotosOnInvalidGrant(userId: number, sessionId?: string) {
  await userTokens.delete(userId, 'google_photos').catch(() => {});
  if (sessionId?.trim()) {
    await googlePickerSessions.delete(sessionId.trim()).catch(() => {});
  }
}

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
    const body = (await request.json().catch(() => ({}))) as {
      date?: string;
      /** true면 여러 장 선택 → 각 장의 createTime(KST)으로 picked_photos 저장 */
      batch?: boolean;
    };
    const batchMode = Boolean(body.batch);
    const photoDate =
      body.date ||
      new Date(
        new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' })
      )
        .toISOString()
        .slice(0, 10);

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

    const session = await createPickerSession(
      access_token,
      batchMode ? { maxItemCount: 500 } : undefined
    );

    const tokenExpIso = new Date(Date.now() + 3500 * 1000).toISOString();
    try {
      await googlePickerSessions.upsert({
        session_id: session.id,
        user_id: userId,
        access_token,
        access_token_expires_at: tokenExpIso,
      });
    } catch (persistErr) {
      console.error(
        '[POST /api/photos/picker] google_picker_sessions 저장 실패 (마이그레이션 미적용 가능):',
        persistErr
      );
    }

    return NextResponse.json({
      sessionId: session.id,
      pickerUri: session.pickerUri,
      photoDate,
      batch: batchMode,
    });
  } catch (e: unknown) {
    if (isGoogleRefreshTokenInvalidError(e)) {
      await clearGooglePhotosOnInvalidGrant(userId);
      return NextResponse.json(
        { error: GOOGLE_RECONNECT_MESSAGE, code: 'GOOGLE_REFRESH_TOKEN_INVALID', reconnect: true },
        { status: 403 }
      );
    }
    const msg = e instanceof Error ? e.message : 'Picker 세션 생성 중 오류가 발생했습니다.';
    if (isGoogleOauthResponseRevokedErrorMessage(msg)) {
      await clearGooglePhotosOnInvalidGrant(userId);
      return NextResponse.json(
        { error: GOOGLE_RECONNECT_MESSAGE, code: 'GOOGLE_REFRESH_TOKEN_INVALID', reconnect: true },
        { status: 403 }
      );
    }
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
  const batch =
    sp.get('batch') === '1' ||
    sp.get('batch') === 'true' ||
    sp.get('batch') === 'yes';

  if (!sessionId) {
    return NextResponse.json({ error: 'sessionId query param required' }, { status: 400 });
  }
  if (!batch && !photoDate) {
    return NextResponse.json(
      { error: 'date query param required (or batch=1 for multi-select)' },
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

    const bound = await googlePickerSessions.find(sessionId, userId);

    let accessToken: string;
    if (bound) {
      accessToken = bound.access_token;
      const boundExp = new Date(bound.access_token_expires_at).getTime();
      if (
        boundExp - Date.now() <
        ACCESS_TOKEN_REFRESH_IF_EXPIRES_WITHIN_MS
      ) {
        const refreshed = await refreshAccessToken(gpToken.refresh_token);
        accessToken = refreshed.access_token;
        const newExp = new Date(Date.now() + 3500 * 1000).toISOString();
        await userTokens.upsert({
          user_id: userId,
          provider: 'google_photos',
          access_token: accessToken,
          refresh_token: gpToken.refresh_token,
          token_expires_at: newExp,
        });
        await googlePickerSessions.updateToken(
          sessionId,
          userId,
          accessToken,
          newExp
        );
      }
    } else {
      let at = gpToken.access_token ?? '';
      const expiresAtMs = gpToken.token_expires_at
        ? new Date(gpToken.token_expires_at).getTime()
        : 0;
      const mustRefresh =
        !at ||
        !expiresAtMs ||
        expiresAtMs - Date.now() < ACCESS_TOKEN_REFRESH_IF_EXPIRES_WITHIN_MS;

      if (mustRefresh) {
        const refreshed = await refreshAccessToken(gpToken.refresh_token);
        at = refreshed.access_token;
        await userTokens.upsert({
          user_id: userId,
          provider: 'google_photos',
          access_token: at,
          refresh_token: gpToken.refresh_token,
          token_expires_at: new Date(Date.now() + 3500 * 1000).toISOString(),
        });
      }
      accessToken = at;
    }

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
          await googlePickerSessions.delete(sessionId).catch(() => {});
          return NextResponse.json(
            {
              error:
                '피커 세션을 찾을 수 없습니다. «사진 선택»을 다시 눌러 주세요. 잠시 후에도 같으면 새로고침 후 재시도해 주세요.',
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
      await googlePickerSessions.delete(sessionId).catch(() => {});
      return NextResponse.json({ status: 'empty', message: '사진이 선택되지 않았습니다.' });
    }

    if (batch) {
      const photos = items.filter((i) => i.type === 'PHOTO');
      if (photos.length === 0) {
        await deletePickerSession(accessToken, sessionId).catch(() => {});
        await googlePickerSessions.delete(sessionId).catch(() => {});
        return NextResponse.json({
          status: 'empty',
          message: '선택한 항목에 사진(PHOTO)이 없습니다. 동영상만 있으면 저장되지 않습니다.',
          batch: true,
        });
      }
      const limited = photos.slice(0, MAX_BATCH_PHOTOS);
      const results: { photoDate: string; blobUrl: string; mediaId: string }[] = [];
      const skipped: string[] = [];

      for (const item of limited) {
        const ct = item.createTime;
        if (!ct) {
          skipped.push(`${item.id}: createTime 없음`);
          continue;
        }
        const kstDay = rfc3339ToKstYmd(ct);
        if (!kstDay) {
          skipped.push(`${item.id}: 날짜 파싱 실패`);
          continue;
        }
        try {
          const { buffer, contentType } = await downloadPhotoAsBuffer(
            item.mediaFile.baseUrl,
            accessToken
          );
          const up = await uploadUserPhotoBufferWithFallback(buffer, contentType, 'records');
          if (!up.ok) {
            skipped.push(`${item.id}: ${up.error}`);
            continue;
          }
          const blobUrl = up.url;
          await pickedPhotos.upsert(userId, kstDay, blobUrl);
          results.push({ photoDate: kstDay, blobUrl, mediaId: item.id });
        } catch (oneErr: unknown) {
          skipped.push(
            `${item.id}: ${oneErr instanceof Error ? oneErr.message : String(oneErr)}`
          );
        }
      }

      await deletePickerSession(accessToken, sessionId).catch(() => {});
      await googlePickerSessions.delete(sessionId).catch(() => {});

      return NextResponse.json({
        status: 'done',
        batch: true,
        totalItems: items.length,
        photoItems: photos.length,
        processed: limited.length,
        truncated: photos.length > MAX_BATCH_PHOTOS,
        saved: results.length,
        results,
        skipped: skipped.length > 0 ? skipped : undefined,
      });
    }

    const firstPhoto = items.find((i) => i.type === 'PHOTO') || items[0];
    const { buffer, contentType } = await downloadPhotoAsBuffer(
      firstPhoto.mediaFile.baseUrl,
      accessToken
    );
    const up = await uploadUserPhotoBufferWithFallback(buffer, contentType, 'records');

    if (!up.ok) {
      await googlePickerSessions.delete(sessionId).catch(() => {});
      return NextResponse.json(
        { error: up.error || '사진 업로드에 실패했습니다.' },
        { status: 500 }
      );
    }
    const blobUrl = up.url;

    await pickedPhotos.upsert(userId, photoDate, blobUrl);

    await deletePickerSession(accessToken, sessionId).catch(() => {});
    await googlePickerSessions.delete(sessionId).catch(() => {});

    return NextResponse.json({
      status: 'done',
      photoDate,
      blobUrl,
      totalPicked: items.length,
    });
  } catch (e: unknown) {
    if (isGoogleRefreshTokenInvalidError(e)) {
      await clearGooglePhotosOnInvalidGrant(userId, sessionId);
      return NextResponse.json(
        { error: GOOGLE_RECONNECT_MESSAGE, code: 'GOOGLE_REFRESH_TOKEN_INVALID', reconnect: true },
        { status: 403 }
      );
    }
    const msg = e instanceof Error ? e.message : 'Picker 폴링 중 오류가 발생했습니다.';
    if (isGoogleOauthResponseRevokedErrorMessage(msg)) {
      await clearGooglePhotosOnInvalidGrant(userId, sessionId);
      return NextResponse.json(
        { error: GOOGLE_RECONNECT_MESSAGE, code: 'GOOGLE_REFRESH_TOKEN_INVALID', reconnect: true },
        { status: 403 }
      );
    }
    console.error('[GET /api/photos/picker]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
