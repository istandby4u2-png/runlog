import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase 환경 변수가 설정되지 않았습니다.');
  console.warn('⚠️ .env 파일에 NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 추가해주세요.');
}

// 클라이언트 사이드용 (공개 키 사용)
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// 서버 사이드용 (서비스 롤 키 사용, 관리자 권한)
export const supabaseAdmin = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// 데이터베이스 초기화 확인
export async function checkDatabaseConnection() {
  if (!supabaseAdmin) {
    console.error('❌ Supabase 관리자 클라이언트가 초기화되지 않았습니다.');
    return false;
  }

  try {
    const { data, error } = await supabaseAdmin.from('users').select('count').limit(1);
    if (error) {
      console.error('❌ Supabase 연결 실패:', error);
      return false;
    }
    console.log('✅ Supabase 연결 성공');
    return true;
  } catch (error) {
    console.error('❌ Supabase 연결 오류:', error);
    return false;
  }
}
