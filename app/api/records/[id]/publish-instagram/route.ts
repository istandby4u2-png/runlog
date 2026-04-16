import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { publishExistingRecordToInstagram } from '@/lib/publish-existing-record-instagram';

export const maxDuration = 300;

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromRequest();
    if (!userId) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const recordId = parseInt(params.id, 10);
    if (!Number.isFinite(recordId)) {
      return NextResponse.json({ error: '잘못된 기록 ID입니다.' }, { status: 400 });
    }

    const result = await publishExistingRecordToInstagram(userId, recordId);
    if (!result.ok) {
      const status =
        result.error === '기록을 찾을 수 없습니다.'
          ? 404
          : result.error === '권한이 없습니다.'
            ? 403
            : 400;
      return NextResponse.json(
        { error: result.error, log: result.log },
        { status }
      );
    }

    return NextResponse.json({
      ok: true,
      igMediaId: result.igMediaId,
      log: result.log,
    });
  } catch (error) {
    console.error('publish-instagram:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
