import { NextRequest, NextResponse } from 'next/server';
import { courses } from '@/lib/db-supabase';
import { getUserIdFromRequest } from '@/lib/auth';
import { uploadImage } from '@/lib/cloudinary';
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
    const searchParams = request.nextUrl.searchParams;
    const searchQuery = searchParams.get('search');

    let coursesList;
    if (searchQuery && searchQuery.trim()) {
      // 검색 쿼리가 있으면 검색 수행
      coursesList = await courses.search(searchQuery.trim(), userId);
    } else {
      // 검색 쿼리가 없으면 전체 목록
      coursesList = await courses.findAll(userId);
    }
    
    return NextResponse.json(coursesList);
  } catch (error: any) {
    console.error('Get courses error:', error);
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
    const description = formData.get('description') as string;
    const pathData = formData.get('path_data') as string;
    const distance = formData.get('distance') as string;
    const courseType = formData.get('course_type') as string;
    const surfaceType = formData.get('surface_type') as string;
    const elevation = formData.get('elevation') as string;
    const trafficLights = formData.get('traffic_lights') as string;
    const streetlights = formData.get('streetlights') as string;
    const imageFile = formData.get('image') as File | null;

    if (!title || !pathData) {
      return NextResponse.json(
        { error: '제목과 경로 데이터는 필수입니다.' },
        { status: 400 }
      );
    }

    let imageUrl = null;
    if (imageFile && imageFile.size > 0) {
      try {
        imageUrl = await uploadImage(imageFile, 'courses');
        if (!imageUrl) {
          console.error('❌ 이미지 업로드 실패: uploadImage가 null을 반환했습니다.');
          // 이미지 업로드 실패해도 코스는 저장 가능하도록 계속 진행
        }
      } catch (error: any) {
        console.error('❌ 이미지 업로드 중 오류 발생:', error);
        console.error('❌ 오류 메시지:', error?.message);
        // 이미지 업로드 실패해도 코스는 저장 가능하도록 계속 진행
      }
    }

    const newCourse = await courses.create(
      userId,
      title,
      description || null,
      pathData,
      imageUrl,
      distance ? parseFloat(distance) : null,
      courseType || null,
      surfaceType || null,
      elevation || null,
      trafficLights || null,
      streetlights || null
    );

    return NextResponse.json(
      { message: '코스가 등록되었습니다.', courseId: newCourse.id },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create course error:', error);
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
