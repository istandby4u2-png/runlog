import { NextRequest, NextResponse } from 'next/server';
import { calculateCalories } from '@/lib/gemini';

export async function POST(request: NextRequest) {
  try {
    // 환경 변수 확인
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('🔑 GEMINI_API_KEY 확인:', apiKey ? `설정됨 (길이: ${apiKey.length})` : '❌ 설정되지 않음');
    
    const { meal } = await request.json();
    console.log('📝 칼로리 계산 API 호출:', meal);

    if (!meal || typeof meal !== 'string') {
      console.error('❌ 잘못된 요청: meal이 없거나 문자열이 아님');
      return NextResponse.json(
        { error: '식사 내용을 입력해주세요.' },
        { status: 400 }
      );
    }

    if (!apiKey) {
      console.error('❌ GEMINI_API_KEY가 설정되지 않았습니다.');
      console.error('❌ Vercel 환경 변수에 GEMINI_API_KEY가 Production 환경에 추가되었는지 확인해주세요.');
      return NextResponse.json(
        { error: '서버 설정 오류가 발생했습니다. 관리자에게 문의해주세요.' },
        { status: 500 }
      );
    }

    console.log('🔄 칼로리 계산 시작...');
    const calories = await calculateCalories(meal);
    console.log('📊 계산 결과:', calories);

    if (calories === null) {
      console.error('❌ 칼로리 계산 실패 - calculateCalories가 null 반환');
      console.error('❌ 가능한 원인:');
      console.error('   1. GEMINI_API_KEY가 설정되지 않았거나 잘못됨');
      console.error('   2. Gemini API 호출 실패 (네트워크 오류, API 키 오류 등)');
      console.error('   3. Gemini API 응답에서 숫자를 찾을 수 없음');
      console.error('   4. 계산된 칼로리 값이 유효하지 않음 (음수 또는 너무 큰 값)');
      return NextResponse.json(
        { 
          error: '칼로리 계산에 실패했습니다. 서버 터미널의 로그를 확인해주세요.',
          details: '서버 터미널에서 "❌" 표시가 있는 로그를 확인하세요. GEMINI_API_KEY 설정과 Gemini API 응답을 확인해주세요.'
        },
        { status: 500 }
      );
    }

    console.log('✅ 칼로리 계산 성공:', calories);
    return NextResponse.json({ calories });
  } catch (error: any) {
    console.error('❌ Calculate calories API 오류 발생!');
    console.error('❌ 오류 타입:', error?.constructor?.name || typeof error);
    console.error('❌ 오류 메시지:', error?.message || '알 수 없는 오류');
    console.error('❌ 스택 트레이스:', error?.stack);
    console.error('❌ 전체 오류 객체:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    
    // 더 자세한 에러 정보 반환
    return NextResponse.json(
      { 
        error: `서버 오류가 발생했습니다: ${error?.message || '알 수 없는 오류'}`,
        errorType: error?.constructor?.name || typeof error,
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    );
  }
}
