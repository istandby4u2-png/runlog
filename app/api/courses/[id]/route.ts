import { NextRequest, NextResponse } from 'next/server';
import { courses } from '@/lib/db-supabase';
import { getUserIdFromRequest } from '@/lib/auth';
import { uploadImage, deleteImage } from '@/lib/blob-storage';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const courseId = parseInt(params.id);

    const course = await courses.findById(courseId, userId);
    if (!course) {
      return NextResponse.json(
        { error: '코스를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json(course);
  } catch (error: any) {
    console.error('Get course error:', error);
    return NextResponse.json(
      { 
        error: '서버 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const courseId = parseInt(params.id);

    // 코스 소유자 확인
    const existingCourse = await courses.findById(courseId);
    if (!existingCourse) {
      return NextResponse.json(
        { error: '코스를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (existingCourse.user_id !== userId) {
      return NextResponse.json(
        { error: '수정 권한이 없습니다.' },
        { status: 403 }
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
    const visibility = (formData.get('visibility') as string) || 'public';
    const imageFile = formData.get('image') as File | null;
    const removeImage = formData.get('remove_image') === 'true';

    if (!title || !pathData) {
      return NextResponse.json(
        { error: '제목과 경로 데이터는 필수입니다.' },
        { status: 400 }
      );
    }

    let imageUrl = existingCourse.image_url || null;
    
    // 이미지 삭제
    if (removeImage && imageUrl) {
      await deleteImage(imageUrl);
      imageUrl = null;
    }

    // 새 이미지 업로드
    if (imageFile && imageFile.size > 0) {
      try {
        // 기존 이미지 삭제
        if (imageUrl) {
          await deleteImage(imageUrl);
        }
        
        imageUrl = await uploadImage(imageFile, 'courses');
        if (!imageUrl) {
          console.error('❌ 이미지 업로드 실패: uploadImage가 null을 반환했습니다.');
          // 이미지 업로드 실패해도 코스 수정은 계속 진행
        }
      } catch (error: any) {
        console.error('❌ 이미지 업로드 중 오류 발생:', error);
        console.error('❌ 오류 메시지:', error?.message);
        // 이미지 업로드 실패해도 코스 수정은 계속 진행
      }
    }

    await courses.update(courseId, {
      title,
      description: description || null,
      path_data: pathData,
      image_url: imageUrl,
      distance: distance ? parseFloat(distance) : null,
      course_type: courseType || null,
      surface_type: surfaceType || null,
      elevation: elevation || null,
      traffic_lights: trafficLights || null,
      streetlights: streetlights || null,
      visibility
    });

    return NextResponse.json(
      { message: '코스가 수정되었습니다.' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Update course error:', error);
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    const courseId = parseInt(params.id);
    const existingCourse = await courses.findById(courseId);
    
    if (!existingCourse) {
      return NextResponse.json(
        { error: '코스를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (existingCourse.user_id !== userId) {
      return NextResponse.json(
        { error: '삭제 권한이 없습니다.' },
        { status: 403 }
      );
    }

    if (existingCourse.image_url) {
      try {
        await deleteImage(existingCourse.image_url);
      } catch (error: any) {
        console.error('❌ 이미지 삭제 중 오류 발생:', error);
      }
    }

    await courses.delete(courseId);

    return NextResponse.json(
      { message: '코스가 삭제되었습니다.' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Delete course error:', error);
    return NextResponse.json(
      { 
        error: '서버 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}
