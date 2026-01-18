import { NextRequest, NextResponse } from 'next/server';
import { courses } from '@/lib/db-supabase';
import { getUserIdFromRequest } from '@/lib/auth';
import { uploadImage } from '@/lib/cloudinary';

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest();
    const coursesList = await courses.findAll(userId);
    return NextResponse.json(coursesList);
  } catch (error) {
    console.error('Get courses error:', error);
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

    const formData = await request.formData();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const pathData = formData.get('path_data') as string;
    const distance = formData.get('distance') as string;
    const imageFile = formData.get('image') as File | null;

    if (!title || !pathData) {
      return NextResponse.json(
        { error: '제목과 경로 데이터는 필수입니다.' },
        { status: 400 }
      );
    }

    let imageUrl = null;
    if (imageFile && imageFile.size > 0) {
      imageUrl = await uploadImage(imageFile, 'runlog/courses');
    }

    const newCourse = await courses.create(
      userId,
      title,
      description || null,
      pathData,
      imageUrl,
      distance ? parseFloat(distance) : null
    );

    return NextResponse.json(
      { message: '코스가 등록되었습니다.', courseId: newCourse.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create course error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
