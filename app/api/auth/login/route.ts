import { NextRequest, NextResponse } from 'next/server';
import { users } from '@/lib/db-supabase';
import { verifyPassword, generateToken } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Supabase 관리자 클라이언트 확인
    if (!supabaseAdmin) {
      console.error('❌ Supabase 관리자 클라이언트가 초기화되지 않았습니다.');
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY를 확인해주세요.');
      return NextResponse.json(
        { error: '서버 설정 오류가 발생했습니다. 관리자에게 문의해주세요.' },
        { status: 500 }
      );
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: '이메일과 비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 사용자 조회
    let user;
    try {
      user = await users.findByEmail(email);
    } catch (error: any) {
      console.error('Login error - findByEmail:', error);
      if (error.message?.includes('Supabase 관리자 클라이언트')) {
        return NextResponse.json(
          { error: '서버 설정 오류가 발생했습니다. 관리자에게 문의해주세요.' },
          { status: 500 }
        );
      }
      throw error;
    }

    if (!user) {
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    // 비밀번호 확인
    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    // 토큰 생성
    const token = generateToken(user.id);

    // 쿠키 설정
    const response = NextResponse.json(
      { message: '로그인 성공', user: { id: user.id, username: user.username, email: user.email } },
      { status: 200 }
    );

    // 프로덕션 환경에서는 secure 쿠키 사용
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
    
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7일
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
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
