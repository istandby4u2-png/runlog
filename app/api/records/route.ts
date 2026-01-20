import { NextRequest, NextResponse } from 'next/server';
import { runningRecords } from '@/lib/db-supabase';
import { getUserIdFromRequest } from '@/lib/auth';
import { uploadImage } from '@/lib/blob-storage';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Supabase 관리자 클라이언트 확인
    if (!supabaseAdmin) {
      console.error('❌ Supabase 관리자 클라이언트가 초기화되지 않았습니다.');
      return NextResponse.json(
        { error: '서버 설정 오류가 발생했습니다. 관리자에게 문의해주세요.' },
        { status: 500 }
      );
    }

    const userId = getUserIdFromRequest();
    const records = await runningRecords.findAll(userId);
    return NextResponse.json(records);
  } catch (error: any) {
    console.error('Get records error:', error);
    return NextResponse.json(
      { 
        error: '서버 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Supabase 관리자 클라이언트 확인
    if (!supabaseAdmin) {
      console.error('❌ Supabase 관리자 클라이언트가 초기화되지 않았습니다.');
      return NextResponse.json(
        { error: '서버 설정 오류가 발생했습니다. 관리자에게 문의해주세요.' },
        { status: 500 }
      );
    }

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
    const mealTimingHours = formData.get('meal_timing_hours') as string;
    const sleepHours = formData.get('sleep_hours') as string;
    const sleepQuality = formData.get('sleep_quality') as string;
    const visibility = (formData.get('visibility') as string) || 'public';
    const imageFile = formData.get('image') as File | null;

    if (!title || !recordDate) {
      return NextResponse.json(
        { error: '제목과 날짜는 필수입니다.' },
        { status: 400 }
      );
    }

    let imageUrl = null;
    if (imageFile && imageFile.size > 0) {
      try {
        imageUrl = await uploadImage(imageFile, 'records');
        if (!imageUrl) {
          console.error('❌ 이미지 업로드 실패: uploadImage가 null을 반환했습니다.');
          // 이미지 업로드 실패해도 기록은 저장 가능하도록 계속 진행
        }
      } catch (error: any) {
        console.error('❌ 이미지 업로드 중 오류 발생:', error);
        console.error('❌ 오류 메시지:', error?.message);
        // 이미지 업로드 실패해도 기록은 저장 가능하도록 계속 진행
        // 사용자에게는 경고만 표시하고 기록은 저장
      }
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
      calories: calories ? parseInt(calories) : null,
      meal_timing_hours: mealTimingHours ? parseFloat(mealTimingHours) : null,
      sleep_hours: sleepHours ? parseFloat(sleepHours) : null,
      sleep_quality: sleepQuality || null,
      visibility: visibility as 'public' | 'loggers' | 'private'
    });

    return NextResponse.json(
      { message: '기록이 등록되었습니다.', recordId: record.id },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create record error:', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
    });
    return NextResponse.json(
      { 
        error: '서버 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}
