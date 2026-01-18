import { NextRequest, NextResponse } from 'next/server';
import { runningRecords } from '@/lib/db-supabase';
import { getUserIdFromRequest } from '@/lib/auth';
import { uploadImage } from '@/lib/cloudinary';

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest();
    const records = await runningRecords.findAll(userId);
    return NextResponse.json(records);
  } catch (error) {
    console.error('Get records error:', error);
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
    const content = formData.get('content') as string;
    const recordDate = formData.get('record_date') as string;
    const courseId = formData.get('course_id') as string;
    const distance = formData.get('distance') as string;
    const duration = formData.get('duration') as string;
    const weather = formData.get('weather') as string;
    const mood = formData.get('mood') as string;
    const meal = formData.get('meal') as string;
    const calories = formData.get('calories') as string;
    const imageFile = formData.get('image') as File | null;

    if (!title || !recordDate) {
      return NextResponse.json(
        { error: '제목과 날짜는 필수입니다.' },
        { status: 400 }
      );
    }

    let imageUrl = null;
    if (imageFile && imageFile.size > 0) {
      imageUrl = await uploadImage(imageFile, 'records');
    }

    const record = await runningRecords.create({
      user_id: userId,
      course_id: courseId ? parseInt(courseId) : null,
      title,
      content: content || null,
      image_url: imageUrl,
      distance: distance ? parseFloat(distance) : null,
      duration: duration ? parseInt(duration) : null,
      record_date: recordDate,
      weather: weather || null,
      mood: mood || null,
      meal: meal || null,
      calories: calories ? parseInt(calories) : null
    });

    return NextResponse.json(
      { message: '기록이 등록되었습니다.', recordId: record.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create record error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
