import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
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

    // 기존 좋아요 확인
    const existingLike = course_id
      ? db.prepare('SELECT id FROM likes WHERE user_id = ? AND course_id = ?').get(userId, course_id)
      : db.prepare('SELECT id FROM likes WHERE user_id = ? AND record_id = ?').get(userId, record_id);

    if (existingLike) {
      // 좋아요 취소
      if (course_id) {
        db.prepare('DELETE FROM likes WHERE user_id = ? AND course_id = ?').run(userId, course_id);
      } else {
        db.prepare('DELETE FROM likes WHERE user_id = ? AND record_id = ?').run(userId, record_id);
      }
      return NextResponse.json({ message: '좋아요가 취소되었습니다.', liked: false });
    } else {
      // 좋아요 추가
      if (course_id) {
        db.prepare('INSERT INTO likes (user_id, course_id) VALUES (?, ?)').run(userId, course_id);
      } else {
        db.prepare('INSERT INTO likes (user_id, record_id) VALUES (?, ?)').run(userId, record_id);
      }
      return NextResponse.json({ message: '좋아요가 추가되었습니다.', liked: true });
    }
  } catch (error) {
    console.error('Like error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
