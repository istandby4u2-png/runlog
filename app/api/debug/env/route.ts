import { NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';

// 환경 변수 확인용 디버그 엔드포인트
// 보안을 위해 인증된 사용자만 접근 가능
export async function GET() {
  try {
    const userId = getUserIdFromRequest();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const envStatus = {
      cloudinary: {
        cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME 
          ? `✅ 설정됨 (${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME})` 
          : '❌ 없음',
        apiKey: process.env.CLOUDINARY_API_KEY 
          ? `✅ 설정됨 (${process.env.CLOUDINARY_API_KEY.substring(0, 4)}...)` 
          : '❌ 없음',
        apiSecret: process.env.CLOUDINARY_API_SECRET 
          ? `✅ 설정됨 (${process.env.CLOUDINARY_API_SECRET.substring(0, 4)}...)` 
          : '❌ 없음',
      },
      supabase: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL 
          ? `✅ 설정됨` 
          : '❌ 없음',
        serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY 
          ? `✅ 설정됨` 
          : '❌ 없음',
      },
      other: {
        jwtSecret: process.env.JWT_SECRET 
          ? `✅ 설정됨` 
          : '❌ 없음',
        geminiApiKey: process.env.GEMINI_API_KEY 
          ? `✅ 설정됨` 
          : '❌ 없음',
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY 
          ? `✅ 설정됨` 
          : '❌ 없음',
      }
    };

    return NextResponse.json(envStatus);
  } catch (error) {
    console.error('Debug env error:', error);
    return NextResponse.json(
      { error: 'Failed to check environment variables' },
      { status: 500 }
    );
  }
}
