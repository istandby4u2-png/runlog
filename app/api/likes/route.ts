import { NextRequest, NextResponse } from 'next/server';
import { likes } from '@/lib/db-supabase';
import { getUserIdFromRequest } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest();
    if (!userId) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { course_id, record_id } = await request.json();

    if (!course_id && !record_id) {
      return NextResponse.json(
        { error: 'course_id 또는 record_id가 필요합니다.' },
        { status: 400 }
      );
    }

    const result = await likes.toggle(
      course_id ? parseInt(course_id) : null,
      record_id ? parseInt(record_id) : null,
      userId
    );

    return NextResponse.json({
      message: result.action === 'added' ? '좋아요가 추가되었습니다.' : '좋아요가 취소되었습니다.',
      liked: result.action === 'added'
    });
  } catch (error) {
    console.error('Like error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
