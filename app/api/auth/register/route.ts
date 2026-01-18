import { NextRequest, NextResponse } from 'next/server';
import { users } from '@/lib/db-supabase';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username, email, password } = await request.json();

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: '모든 필드를 입력해주세요.' },
        { status: 400 }
      );
    }

    // 중복 확인
    const existingUser = await users.findByUsernameOrEmail(username, email);
    if (existingUser) {
      return NextResponse.json(
        { error: '이미 사용 중인 이메일 또는 사용자 이름입니다.' },
        { status: 400 }
      );
    }

    // 비밀번호 해시화
    const hashedPassword = await hashPassword(password);

    // 사용자 생성
    const newUser = await users.create(username, email, hashedPassword);

    return NextResponse.json(
      { message: '회원가입이 완료되었습니다.', userId: newUser.id },
      { status: 201 }
    );
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
