import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromRequest();
    const courseId = parseInt(params.id);

    let course: any;
    if (userId) {
      course = db.prepare(`
        SELECT 
          c.*,
          u.username,
          (SELECT COUNT(*) FROM likes WHERE course_id = c.id) as likes_count,
          (SELECT COUNT(*) FROM comments WHERE course_id = c.id) as comments_count,
          EXISTS(SELECT 1 FROM likes WHERE course_id = c.id AND user_id = ?) as is_liked
        FROM courses c
        JOIN users u ON c.user_id = u.id
        WHERE c.id = ?
      `).get(userId, courseId);
    } else {
      course = db.prepare(`
        SELECT 
          c.*,
          u.username,
          (SELECT COUNT(*) FROM likes WHERE course_id = c.id) as likes_count,
          (SELECT COUNT(*) FROM comments WHERE course_id = c.id) as comments_count,
          0 as is_liked
        FROM courses c
        JOIN users u ON c.user_id = u.id
        WHERE c.id = ?
      `).get(courseId);
    }

    if (!course) {
      return NextResponse.json(
        { error: '코스를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json(course);
  } catch (error) {
    console.error('Get course error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
