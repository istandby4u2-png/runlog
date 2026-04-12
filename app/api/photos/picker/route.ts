import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import {
  refreshAccessToken,
  createPickerSession,
  getPickerSession,
  listPickedMediaItems,
  downloadPhotoAsBuffer,
  deletePickerSession,
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
  const sessionId = sp.get('sessionId');
  const photoDate = sp.get('date');

  if (!sessionId || !photoDate) {
    return NextResponse.json(
      { error: 'sessionId and date query params required' },
      { status: 400 }
    );
  }

  const gpToken = await userTokens.findByProvider(userId, 'google_photos');
  if (!gpToken?.access_token) {
    return NextResponse.json({ error: 'Google Photos not connected' }, { status: 400 });
  }

  let accessToken = gpToken.access_token;
  const expiresAt = gpToken.token_expires_at
    ? new Date(gpToken.token_expires_at).getTime()
    : 0;
  if (expiresAt > 0 && expiresAt - Date.now() < 60_000 && gpToken.refresh_token) {
    const refreshed = await refreshAccessToken(gpToken.refresh_token);
    accessToken = refreshed.access_token;
    await userTokens.upsert({
      user_id: userId,
      provider: 'google_photos',
      access_token: accessToken,
      refresh_token: gpToken.refresh_token,
      token_expires_at: new Date(Date.now() + 3500 * 1000).toISOString(),
    });
  }

  const session = await getPickerSession(accessToken, sessionId);

  if (!session.mediaItemsSet) {
    return NextResponse.json({
      status: 'waiting',
      pollingConfig: session.pollingConfig,
    });
  }

  const items = await listPickedMediaItems(accessToken, sessionId);
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
}
