import { NextRequest, NextResponse } from 'next/server';
import { users } from '@/lib/db-supabase';
import { getUserIdFromRequest } from '@/lib/auth';
import { uploadImage, deleteImage } from '@/lib/blob-storage';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
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

    const user = await users.findById(userId);
    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: user.id,
      username: user.username,
      email: user.email,
      profile_image_url: user.profile_image_url || null,
      created_at: user.created_at
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { 
        error: '서버 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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

    const formData = await request.formData();
    const username = formData.get('username') as string;
    const imageFile = formData.get('image') as File | null;
    const removeImage = formData.get('remove_image') === 'true';

    const existingUser = await users.findById(userId);
    if (!existingUser) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    let profileImageUrl = existingUser.profile_image_url || null;

    // 이미지 삭제
    if (removeImage && profileImageUrl) {
      try {
        await deleteImage(profileImageUrl);
        profileImageUrl = null;
      } catch (error: any) {
        console.error('❌ 프로필 이미지 삭제 중 오류 발생:', error);
      }
    }

    // 새 이미지 업로드
    if (imageFile && imageFile.size > 0) {
      try {
        // 기존 이미지 삭제
        if (profileImageUrl) {
          await deleteImage(profileImageUrl);
        }
        
        profileImageUrl = await uploadImage(imageFile, 'records'); // 프로필 이미지도 records 폴더에 저장
        if (!profileImageUrl) {
          console.error('❌ 프로필 이미지 업로드 실패');
        }
      } catch (error: any) {
        console.error('❌ 프로필 이미지 업로드 중 오류 발생:', error);
      }
    }

    const updates: { username?: string; profile_image_url?: string | null } = {};
    if (username && username.trim()) {
      updates.username = username.trim();
    }
    if (profileImageUrl !== undefined) {
      updates.profile_image_url = profileImageUrl;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: '수정할 내용이 없습니다.' },
        { status: 400 }
      );
    }

    const updatedUser = await users.update(userId, updates);

    return NextResponse.json({
      message: '프로필이 수정되었습니다.',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        profile_image_url: updatedUser.profile_image_url || null,
        created_at: updatedUser.created_at
      }
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { 
        error: '서버 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}
