import { NextRequest, NextResponse } from 'next/server';
import { courses } from '@/lib/db-supabase';
import { getUserIdFromRequest } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromRequest();
    const courseId = parseInt(params.id);

    const course = await courses.findById(courseId, userId);
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
