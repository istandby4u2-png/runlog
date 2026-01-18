import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';
import { getUserIdFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const courseId = searchParams.get('course_id');
    const recordId = searchParams.get('record_id');

    if (!courseId && !recordId) {
      return NextResponse.json(
        { error: 'course_id 또는 record_id가 필요합니다.' },
        { status: 400 }
      );
    }

    const comments = courseId
      ? db.prepare(`
          SELECT c.*, u.username
          FROM comments c
          JOIN users u ON c.user_id = u.id
          WHERE c.course_id = ?
          ORDER BY c.created_at ASC
        `).all(courseId)
      : db.prepare(`
          SELECT c.*, u.username
          FROM comments c
          JOIN users u ON c.user_id = u.id
          WHERE c.record_id = ?
          ORDER BY c.created_at ASC
        `).all(recordId);

    return NextResponse.json(comments);
  } catch (error) {
    console.error('Get comments error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest();
    if (!userId) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const { course_id, record_id, content } = await request.json();

    if (!content || (!course_id && !record_id)) {
      return NextResponse.json(
        { error: '내용과 course_id 또는 record_id가 필요합니다.' },
        { status: 400 }
      );
    }

    const result = db.prepare(`
      INSERT INTO comments (user_id, course_id, record_id, content)
      VALUES (?, ?, ?, ?)
    `).run(
      userId,
      course_id || null,
      record_id || null,
      content
    );

    return NextResponse.json(
      { message: '댓글이 등록되었습니다.', commentId: result.lastInsertRowid },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create comment error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
