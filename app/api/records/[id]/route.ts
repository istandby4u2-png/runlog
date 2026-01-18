import { NextRequest, NextResponse } from 'next/server';
import { runningRecords } from '@/lib/db-supabase';
import { getUserIdFromRequest } from '@/lib/auth';
import { uploadImage, deleteImage } from '@/lib/cloudinary';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromRequest();
    const recordId = parseInt(params.id);

    const record = await runningRecords.findById(recordId, userId);
    if (!record) {
      return NextResponse.json(
        { error: '기록을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json(record);
  } catch (error) {
    console.error('Get record error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromRequest();
    if (!userId) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const recordId = parseInt(params.id);

    // 기록 소유자 확인
    const existingRecord = await runningRecords.findById(recordId);
    if (!existingRecord) {
      return NextResponse.json(
        { error: '기록을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (existingRecord.user_id !== userId) {
      return NextResponse.json(
        { error: '수정 권한이 없습니다.' },
        { status: 403 }
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
    const removeImage = formData.get('remove_image') === 'true';

    if (!title || !recordDate) {
      return NextResponse.json(
        { error: '제목과 날짜는 필수입니다.' },
        { status: 400 }
      );
    }

    let imageUrl = existingRecord.image_url || null;
    
    // 이미지 삭제
    if (removeImage && imageUrl) {
      await deleteImage(imageUrl);
      imageUrl = null;
    }

    // 새 이미지 업로드
    if (imageFile && imageFile.size > 0) {
      // 기존 이미지 삭제
      if (imageUrl) {
        await deleteImage(imageUrl);
      }
      
      imageUrl = await uploadImage(imageFile, 'runlog/records');
    }

    await runningRecords.update(recordId, {
      title,
      content: content || null,
      record_date: recordDate,
      course_id: courseId ? parseInt(courseId) : null,
      distance: distance ? parseFloat(distance) : null,
      duration: duration ? parseInt(duration) : null,
      image_url: imageUrl,
      weather: weather || null,
      mood: mood || null,
      meal: meal || null,
      calories: calories ? parseInt(calories) : null
    });

    return NextResponse.json(
      { message: '기록이 수정되었습니다.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Update record error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = getUserIdFromRequest();
    if (!userId) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const recordId = parseInt(params.id);

    // 기록 소유자 확인
    const existingRecord = await runningRecords.findById(recordId);
    if (!existingRecord) {
      return NextResponse.json(
        { error: '기록을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (existingRecord.user_id !== userId) {
      return NextResponse.json(
        { error: '삭제 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 이미지 파일 삭제
    if (existingRecord.image_url) {
      await deleteImage(existingRecord.image_url);
    }

    // 기록 삭제
    await runningRecords.delete(recordId);

    return NextResponse.json(
      { message: '기록이 삭제되었습니다.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Delete record error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
