import { NextResponse } from 'next/server';

/**
 * 칼로리 계산 API 상태 확인용 테스트 엔드포인트
 * GET /api/calories/test
 */
export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  return NextResponse.json({
    status: 'ok',
    geminiApiKey: {
      exists: !!apiKey,
      length: apiKey?.length || 0,
      preview: apiKey ? `${apiKey.substring(0, 10)}...` : 'not set'
    },
    message: apiKey 
      ? '✅ GEMINI_API_KEY가 설정되어 있습니다.' 
      : '❌ GEMINI_API_KEY가 설정되지 않았습니다.',
    instructions: apiKey
      ? '칼로리 계산 기능을 사용할 수 있습니다.'
      : '.env 파일에 GEMINI_API_KEY=your_api_key 형식으로 추가하고 서버를 재시작하세요.'
  });
}
