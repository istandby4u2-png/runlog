# 단계별 디버깅 가이드

## 현재 상황

- 여전히 서버 오류 발생
- 체계적인 문제 해결 필요

---

## Step 1: 실제 오류 메시지 확인 (가장 중요!)

### 방법 1: 브라우저 개발자 도구

1. **프로덕션 URL에서 작업 시도**
   - 로그인, 기록 등록, 코스 등록 등

2. **브라우저 개발자 도구 열기**
   - `F12` 또는 `Cmd + Option + I` (Mac)

3. **Network 탭 확인**
   - 실패한 요청 찾기 (빨간색)
   - 클릭하여 상세 정보 확인

4. **Response 탭 확인**
   - 오류 메시지 전체 복사
   - 예: `{"error": "서버 설정 오류가 발생했습니다..."}`

### 방법 2: Vercel 함수 로그

1. **Vercel 대시보드 접속**
   - https://vercel.com/dashboard
   - 프로젝트 선택

2. **"Logs" 탭 클릭**
   - 프로젝트 페이지에서 "Logs" 탭
   - 또는 Deployments > 최근 배포 > "Logs"

3. **오류 로그 확인**
   - 실패한 API 요청의 로그 확인
   - 오류 메시지 전체 복사

---

## Step 2: 환경 변수 확인

### Vercel 환경 변수 체크리스트

Vercel > Settings > Environment Variables에서 다음이 **모두** 설정되었는지 확인:

#### 필수 환경 변수 (9개)

- [ ] `NEXT_PUBLIC_SUPABASE_URL` (Production 체크)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Production 체크)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (Production 체크) ⚠️ **가장 중요!**
- [ ] `JWT_SECRET` (Production 체크)
- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (Production 체크)
- [ ] `GEMINI_API_KEY` (Production 체크)
- [ ] `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` (Production 체크)
- [ ] `CLOUDINARY_API_KEY` (Production 체크)
- [ ] `CLOUDINARY_API_SECRET` (Production 체크)

**중요:** 각 변수의 **Production** 체크박스가 체크되어 있어야 합니다!

---

## Step 3: 환경 변수 값 확인

### Supabase 값 확인

1. **Supabase 대시보드 접속**
   - https://supabase.com/dashboard
   - 프로젝트 선택

2. **Settings > API**
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role secret → `SUPABASE_SERVICE_ROLE_KEY` ⚠️

3. **Vercel 환경 변수와 비교**
   - 값이 정확히 일치하는지 확인

### Cloudinary 값 확인

1. **Cloudinary 대시보드 접속**
   - https://cloudinary.com/console
   - 로그인

2. **Settings > Product environment settings**
   - Cloud name → `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
   - API Key (숫자) → `CLOUDINARY_API_KEY`
   - API Secret (Reveal 클릭) → `CLOUDINARY_API_SECRET`

3. **Vercel 환경 변수와 비교**
   - 값이 정확히 일치하는지 확인
   - 공백이나 따옴표가 포함되지 않았는지 확인

---

## Step 4: Supabase 스키마 확인

1. **Supabase 대시보드 > Table Editor**
   - 다음 테이블이 모두 있는지 확인:
     - `users`
     - `courses`
     - `running_records`
     - `likes`
     - `comments`

2. **테이블이 없으면**
   - SQL Editor에서 스키마 생성
   - `SUPABASE_SCHEMA_SETUP.md` 파일 참고

---

## Step 5: 재배포 확인

1. **Vercel 대시보드 > Deployments**
   - 최근 배포 상태 확인
   - "Ready" 상태인지 확인

2. **재배포 필요 시**
   - 최근 배포 > "..." 메뉴 > "Redeploy"
   - 재배포 완료 대기 (1-2분)

---

## 일반적인 오류와 해결

### 오류 1: "서버 설정 오류가 발생했습니다. 관리자에게 문의해주세요."

**의미:** `SUPABASE_SERVICE_ROLE_KEY` 환경 변수 문제

**해결:**
1. Vercel 환경 변수에서 `SUPABASE_SERVICE_ROLE_KEY` 확인
2. Production 환경에 체크되어 있는지 확인
3. Supabase 대시보드에서 값 재확인
4. 값이 올바른지 확인

---

### 오류 2: "서버 오류가 발생했습니다."

**의미:** 기타 서버 오류

**확인사항:**
1. Vercel 함수 로그에서 상세 오류 확인
2. 모든 환경 변수가 설정되었는지 확인
3. Supabase 스키마 확인
4. 재배포 완료 확인

---

### 오류 3: Cloudinary 업로드 실패

**의미:** Cloudinary 인증 오류

**해결:**
1. Cloudinary 환경 변수 재확인
2. 값이 올바른지 확인 (공백, 따옴표 없이)
3. Cloudinary 대시보드에서 값 재확인
4. 필요하면 API 키 재생성

---

## 빠른 체크리스트

- [ ] 브라우저 개발자 도구에서 실제 오류 메시지 확인
- [ ] Vercel 함수 로그에서 실제 오류 메시지 확인
- [ ] Vercel 환경 변수 모두 확인 (9개)
- [ ] Production 환경에 모두 체크 확인
- [ ] Supabase 스키마 확인 (5개 테이블)
- [ ] Cloudinary 값 재확인
- [ ] 재배포 완료 확인

---

## 다음 단계

1. ⏭️ **실제 오류 메시지 확인** (가장 중요!)
2. ⏭️ **환경 변수 재확인**
3. ⏭️ **Supabase 스키마 확인**
4. ⏭️ **재배포 확인**
5. ⏭️ **문제 해결**

**가장 중요한 것은 실제 오류 메시지를 확인하는 것입니다!**

브라우저 개발자 도구의 Network 탭이나 Vercel 함수 로그에서 실제 오류 메시지를 확인하고 알려주세요. 그러면 더 구체적으로 도와드릴 수 있습니다.

---

## 도움 요청 시 제공할 정보

문제가 계속되면 다음 정보를 제공해주세요:

1. **브라우저 개발자 도구의 Response 내용** (전체)
   - Network 탭 > 실패한 요청 > Response 탭
   - 전체 JSON 내용 복사

2. **Vercel 함수 로그의 오류 메시지** (전체)
   - Vercel 대시보드 > Logs
   - 오류 로그 전체 복사

3. **환경 변수 설정 여부**
   - Vercel > Settings > Environment Variables
   - 모든 변수가 Production 환경에 추가되었는지 확인

4. **Supabase 테이블 확인**
   - Supabase > Table Editor
   - 모든 테이블이 있는지 확인
