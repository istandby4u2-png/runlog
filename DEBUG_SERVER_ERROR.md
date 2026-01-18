# 프로덕션 서버 오류 디버깅

## 현재 상황

- 로그인 API 개선 완료
- Git 푸시 완료
- 여전히 프로덕션에서 서버 오류 발생

---

## 오류 메시지 확인 (가장 중요!)

### 방법 1: 브라우저 개발자 도구 (가장 빠름)

1. **프로덕션 URL에서 로그인 시도**
   - `https://run-nqv1weydx-moonees-projects-94e5a1cd.vercel.app/login`
   - 또는 Vercel에서 제공하는 프로덕션 URL

2. **브라우저 개발자 도구 열기**
   - `F12` 또는 `Cmd + Option + I` (Mac)

3. **Network 탭 확인**
   - `/api/auth/login` 요청 찾기
   - 클릭하여 상세 정보 확인
   - **Response 탭**에서 오류 메시지 확인

4. **오류 메시지 복사**
   - Response의 전체 내용 복사
   - 예: `{"error": "서버 설정 오류가 발생했습니다. 관리자에게 문의해주세요."}`
   - 또는 `{"error": "서버 오류가 발생했습니다."}`

---

### 방법 2: Vercel 함수 로그

1. **Vercel 대시보드 접속**
2. **프로젝트 > Deployments > 최근 배포 > Logs**
3. **로그인 시도 후 로그 확인**
   - `/api/auth/login` 관련 로그 확인
   - 오류 메시지 확인

---

## 일반적인 오류와 해결

### 오류 1: "서버 설정 오류가 발생했습니다. 관리자에게 문의해주세요."

**원인:** `SUPABASE_SERVICE_ROLE_KEY` 환경 변수 문제

**해결:**
1. Vercel > Settings > Environment Variables
2. `SUPABASE_SERVICE_ROLE_KEY` 확인
3. **Production 환경에 체크**되어 있는지 확인
4. 값이 올바른지 확인 (Supabase 대시보드에서 복사)
5. 재배포 (환경 변수 변경 후 자동 재배포 또는 수동 재배포)

---

### 오류 2: "서버 오류가 발생했습니다."

**원인:** 기타 서버 오류

**확인사항:**
1. Vercel 함수 로그에서 상세 오류 확인
2. Supabase 연결 확인
3. 환경 변수 확인

---

### 오류 3: "이메일 또는 비밀번호가 올바르지 않습니다."

**원인:** 
- 회원가입이 완료되지 않음
- 잘못된 이메일/비밀번호 입력

**해결:**
1. 회원가입이 완료되었는지 확인
2. 이메일과 비밀번호를 정확히 입력했는지 확인
3. Supabase Table Editor에서 `users` 테이블에 사용자가 있는지 확인

---

## 환경 변수 확인 체크리스트

Vercel > Settings > Environment Variables에서 다음 변수가 **Production 환경에 추가**되었는지 확인:

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `JWT_SECRET`
- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- [ ] `GEMINI_API_KEY`
- [ ] `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- [ ] `CLOUDINARY_API_KEY`
- [ ] `CLOUDINARY_API_SECRET`

**중요:** 각 변수의 **Production** 체크박스가 체크되어 있어야 합니다!

---

## Supabase 연결 확인

1. **Supabase 대시보드 접속**
2. **Table Editor에서 확인**
   - `users` 테이블 존재 확인
   - 테이블에 데이터가 있는지 확인

3. **API Keys 확인**
   - Settings > API
   - URL과 키가 Vercel 환경 변수와 일치하는지 확인

---

## 빠른 해결 방법

### Step 1: 환경 변수 재확인

1. Vercel > Settings > Environment Variables
2. 모든 변수가 Production 환경에 추가되었는지 확인
3. 값이 올바른지 확인

### Step 2: 수동 재배포

1. Vercel 대시보드 > Deployments
2. 최근 배포 옆 "..." 메뉴 클릭
3. "Redeploy" 선택

### Step 3: 로그 확인

1. 재배포 후 로그인 시도
2. 브라우저 개발자 도구에서 오류 메시지 확인
3. Vercel 함수 로그 확인

---

## 도움 요청 시 제공할 정보

문제가 계속되면 다음 정보를 제공해주세요:

1. **브라우저 개발자 도구의 Response 내용** (전체)
2. **Vercel 함수 로그의 오류 메시지** (전체)
3. **환경 변수 추가 여부** (Production 환경)
4. **Supabase 프로젝트 URL 일치 여부**

---

## 다음 단계

1. ⏭️ 브라우저 개발자 도구에서 오류 메시지 확인
2. ⏭️ Vercel 환경 변수 확인 (Production 환경)
3. ⏭️ Vercel 함수 로그 확인
4. ⏭️ 문제 해결
5. ⏭️ 프로덕션에서 로그인 재시도

**가장 중요한 것은 실제 오류 메시지를 확인하는 것입니다!**

브라우저 개발자 도구의 Network 탭에서 `/api/auth/login` 요청의 Response를 확인하고, 오류 메시지를 알려주세요.
