import { NextRequest, NextResponse } from 'next/server';
import { comments } from '@/lib/db-supabase';
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

    const commentsList = courseId
      ? await comments.findByCourseId(parseInt(courseId))
      : await comments.findByRecordId(parseInt(recordId!));

    return NextResponse.json(commentsList);
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

    const newComment = await comments.create({
      user_id: userId,
      course_id: course_id ? parseInt(course_id) : null,
      record_id: record_id ? parseInt(record_id) : null,
      content
    });

    return NextResponse.json(
      { message: '댓글이 등록되었습니다.', commentId: newComment.id },
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
