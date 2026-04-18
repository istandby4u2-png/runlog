import { NextResponse } from 'next/server';
import { getImageStorageEnvSummary } from '@/lib/blob-storage';

export const dynamic = 'force-dynamic';

/**
 * 이미지 저장소(Vercel Blob / Supabase) 환경이 배포에 맞게 잡혀 있는지 확인합니다.
 * 비밀 값은 노출하지 않고 true/false만 반환합니다.
 */
export async function GET() {
  return NextResponse.json(getImageStorageEnvSummary());
}
