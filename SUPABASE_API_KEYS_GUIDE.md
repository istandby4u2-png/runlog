# Supabase API 키 찾기 가이드

## Supabase 대시보드에서 API 키 확인하기

### 1단계: Supabase 대시보드 접속
1. [supabase.com](https://supabase.com) 접속
2. 로그인 후 프로젝트 선택

### 2단계: Settings > API 메뉴로 이동
1. 왼쪽 사이드바에서 **"Settings"** (⚙️ 아이콘) 클릭
2. **"API"** 메뉴 클릭

### 3단계: API 키 확인

Settings > API 페이지에서 다음 정보를 확인할 수 있습니다:

#### Project URL
- **위치**: 페이지 상단의 **"Project URL"** 섹션
- **형식**: `https://xxxxx.supabase.co`
- **용도**: `NEXT_PUBLIC_SUPABASE_URL` 환경 변수에 사용

#### API Keys 섹션

**1. Publishable key (anon public)**
- **위치**: "API Keys" 섹션의 **"Publishable key"** 또는 **"anon public"**
- **형식**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (긴 문자열)
- **용도**: `NEXT_PUBLIC_SUPABASE_ANON_KEY` 환경 변수에 사용
- **특징**: 
  - 공개되어도 안전함 (Row Level Security로 보호됨)
  - 클라이언트 사이드에서 사용 가능
  - `NEXT_PUBLIC_` 접두사 사용

**2. Secret keys (service_role)**
- **위치**: "API Keys" 섹션의 **"Secret keys"** 섹션
- **형식**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (긴 문자열)
- **용도**: `SUPABASE_SERVICE_ROLE_KEY` 환경 변수에 사용
- **특징**:
  - ⚠️ **절대 공개하지 마세요!** (서버 사이드에서만 사용)
  - Row Level Security를 우회하는 관리자 권한
  - 클라이언트에 노출되면 안 됨
  - `NEXT_PUBLIC_` 접두사 **사용하지 않음**

### 4단계: 키 복사하기

1. **Project URL** 복사
2. **Publishable key (anon public)** 옆의 **"Copy"** 버튼 클릭
3. **Secret keys** 섹션에서 **"service_role"** 키 옆의 **"Copy"** 버튼 클릭
   - 또는 **"Reveal"** 버튼을 클릭하여 키를 표시한 후 복사

---

## .env 파일에 설정하기

복사한 키들을 `.env` 파일에 다음과 같이 설정하세요:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (Publishable key)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (service_role key)
```

---

## 키 매핑 정리

| Supabase 대시보드 표시 | 환경 변수 이름 | 설명 |
|----------------------|---------------|------|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| Publishable key (anon public) | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 공개 키 (클라이언트 사용 가능) |
| Secret keys > service_role | `SUPABASE_SERVICE_ROLE_KEY` | 비밀 키 (서버 전용) |

---

## 주의사항

### ⚠️ SUPABASE_SERVICE_ROLE_KEY 보안
- **절대 GitHub에 커밋하지 마세요!**
- `.env` 파일은 `.gitignore`에 포함되어 있어야 합니다
- Vercel 배포 시에는 환경 변수로만 설정하세요
- 클라이언트 코드에 사용하지 마세요

### ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
- 공개되어도 안전합니다
- Row Level Security (RLS) 정책으로 보호됩니다
- 클라이언트 사이드에서 사용 가능합니다

---

## 문제 해결

### 키를 찾을 수 없나요?
1. Settings > API 메뉴로 이동했는지 확인
2. 프로젝트 소유자인지 확인
3. Secret keys는 "Reveal" 버튼을 클릭해야 표시됩니다

### 키가 작동하지 않나요?
1. 키를 정확히 복사했는지 확인 (앞뒤 공백 제거)
2. `.env` 파일을 저장했는지 확인
3. 개발 서버를 재시작했는지 확인 (`npm run dev`)

---

## 다음 단계

API 키 설정이 완료되면:
1. ✅ `.env` 파일에 모든 Supabase 변수 설정
2. ✅ Cloudinary 변수도 설정
3. ✅ `npm run dev`로 로컬 테스트
4. ✅ Vercel 환경 변수에도 동일하게 설정
