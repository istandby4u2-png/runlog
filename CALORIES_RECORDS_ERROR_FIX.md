# Calories 및 Records API 오류 해결

## 현재 상황

- Calories API 오류 발생
- Records API 오류 발생
- 환경 변수 설정 확인 필요

---

## API별 필요한 환경 변수

### Calories API (`/api/calories`)

필요한 환경 변수:
- `GEMINI_API_KEY` (Production 환경에 체크)

### Records API (`/api/records`)

필요한 환경 변수:
- `SUPABASE_SERVICE_ROLE_KEY` (Production 환경에 체크) ⚠️ **가장 중요!**
- `NEXT_PUBLIC_SUPABASE_URL` (Production 환경에 체크)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Production 환경에 체크)
- `CLOUDINARY_API_KEY` (Production 환경에 체크) - 이미지 업로드 시
- `CLOUDINARY_API_SECRET` (Production 환경에 체크) - 이미지 업로드 시
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` (Production 환경에 체크) - 이미지 업로드 시

---

## 환경 변수 확인 체크리스트

Vercel > Settings > Environment Variables에서 다음이 모두 설정되었는지 확인:

### 필수 환경 변수

- [ ] `NEXT_PUBLIC_SUPABASE_URL` (Production 체크)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` (Production 체크)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (Production 체크) ⚠️ **가장 중요!**
- [ ] `GEMINI_API_KEY` (Production 체크) - 칼로리 계산용
- [ ] `JWT_SECRET` (Production 체크)
- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` (Production 체크)
- [ ] `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` (Production 체크)
- [ ] `CLOUDINARY_API_KEY` (Production 체크)
- [ ] `CLOUDINARY_API_SECRET` (Production 체크)

**중요:** 각 변수의 **Production** 체크박스가 체크되어 있어야 합니다!

---

## 오류 메시지 확인 방법

### 방법 1: 브라우저 개발자 도구

1. **프로덕션 URL에서 작업 시도**
   - 기록 등록 시도
   - 칼로리 계산 시도

2. **브라우저 개발자 도구 열기**
   - `F12` 또는 `Cmd + Option + I` (Mac)

3. **Network 탭 확인**
   - 실패한 요청 찾기 (빨간색으로 표시)
   - 예: `/api/calories`, `/api/records`
   - 클릭하여 상세 정보 확인

4. **Response 탭 확인**
   - Response 탭 클릭
   - 오류 메시지 전체 복사

---

## 일반적인 오류와 해결

### 오류 1: "서버 설정 오류가 발생했습니다. 관리자에게 문의해주세요."

**의미:** 환경 변수 문제

**확인사항:**

#### Records API의 경우:
1. `SUPABASE_SERVICE_ROLE_KEY`가 Vercel 환경 변수에 추가되었는지
2. Production 환경에 체크되어 있는지
3. 값이 올바른지 (Supabase 대시보드에서 복사)

#### Calories API의 경우:
1. `GEMINI_API_KEY`가 Vercel 환경 변수에 추가되었는지
2. Production 환경에 체크되어 있는지
3. 값이 올바른지 (Google AI Studio에서 복사)

---

### 오류 2: "서버 오류가 발생했습니다."

**의미:** 기타 서버 오류

**확인사항:**
1. Vercel 함수 로그에서 상세 오류 확인
2. 모든 환경 변수가 설정되었는지 확인
3. 재배포가 완료되었는지 확인

---

### 오류 3: "인증이 필요합니다."

**의미:** 로그인이 필요함

**해결:**
1. 로그인 완료 확인
2. 쿠키가 설정되었는지 확인

---

## 환경 변수 값 확인 방법

### Gemini API Key 확인

1. **Google AI Studio 접속**
   - https://aistudio.google.com/
   - 로그인

2. **API Key 확인**
   - Get API Key 버튼 클릭
   - 또는 기존 API Key 확인

3. **Vercel 환경 변수에 추가**
   - Key: `GEMINI_API_KEY`
   - Value: Google AI Studio에서 복사한 API Key
   - Environment: ✅ Production, ✅ Preview, ✅ Development

---

### Supabase 값 확인

1. **Supabase 대시보드 접속**
   - https://supabase.com/dashboard
   - 프로젝트 선택

2. **Settings > API 메뉴 클릭**
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon public → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role secret → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **중요!**

---

### Cloudinary 값 확인

1. **Cloudinary 대시보드 접속**
   - https://cloudinary.com/console
   - 로그인

2. **Settings 메뉴 클릭**
   - Cloud name → `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
   - API Key (숫자 값) → `CLOUDINARY_API_KEY`
   - API Secret (Reveal 클릭 후) → `CLOUDINARY_API_SECRET`

---

## 재배포 확인

환경 변수를 추가/수정한 후:

1. **자동 재배포 확인**
   - Vercel이 자동으로 재배포를 시작할 수 있습니다
   - Deployments 탭에서 최근 배포 확인

2. **수동 재배포**
   - Deployments > 최근 배포 > "..." 메뉴 > "Redeploy"
   - 재배포가 완료될 때까지 대기 (보통 1-2분)

---

## 문제 해결 단계

### Step 1: 오류 메시지 확인

1. 브라우저 개발자 도구 > Network 탭
2. 실패한 요청의 Response 확인
3. 오류 메시지 전체 복사

### Step 2: 환경 변수 확인

1. Vercel > Settings > Environment Variables
2. 모든 변수가 Production 환경에 추가되었는지 확인
3. 값이 올바른지 확인

### Step 3: 재배포 확인

1. Deployments 탭에서 최근 배포 확인
2. 재배포가 완료되었는지 확인
3. 필요하면 수동 재배포

### Step 4: Vercel 함수 로그 확인

1. Vercel 대시보드 > Logs
2. 오류 로그 확인
3. 상세 오류 메시지 확인

---

## 빠른 체크리스트

- [ ] Vercel 환경 변수에 모든 변수 추가 (9개)
- [ ] Production 환경에 모두 체크
- [ ] 재배포 완료 확인
- [ ] 브라우저 개발자 도구에서 오류 메시지 확인
- [ ] Vercel 함수 로그 확인

---

## 다음 단계

1. ✅ API 코드 개선 완료
2. ⏭️ 환경 변수 확인 및 추가
3. ⏭️ 재배포 대기
4. ⏭️ 프로덕션에서 테스트
5. ⏭️ 오류 메시지 확인

**환경 변수를 모두 추가한 후, 재배포를 기다리고 프로덕션에서 다시 시도해보세요!**

문제가 계속되면 브라우저 개발자 도구의 Network 탭에서 실패한 요청의 Response를 확인하고, 오류 메시지를 알려주세요.
