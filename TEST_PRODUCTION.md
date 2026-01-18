# 프로덕션 테스트 가이드

## 배포 완료 확인

- ✅ `/api/auth/register` 배포 완료

---

## 프로덕션 테스트

### 1. 회원가입 테스트

1. **프로덕션 URL 접속**
   - `https://run-nqv1weydx-moonees-projects-94e5a1cd.vercel.app/register`
   - 또는 Vercel에서 제공하는 프로덕션 URL

2. **회원가입 시도**
   - Username 입력
   - Email 입력
   - Password 입력
   - "Register" 버튼 클릭

3. **결과 확인**
   - ✅ 성공: 로그인 페이지로 리다이렉트 또는 성공 메시지
   - ❌ 실패: 오류 메시지 확인

---

### 2. 로그인 테스트

1. **로그인 페이지 접속**
   - `/login` 경로

2. **방금 생성한 계정으로 로그인**
   - Email 입력
   - Password 입력
   - "Login" 버튼 클릭

3. **결과 확인**
   - ✅ 성공: 메인 페이지(Feed)로 이동
   - ❌ 실패: 오류 메시지 확인

---

### 3. 다른 기능 테스트

회원가입과 로그인이 성공하면 다음 기능들도 테스트하세요:

- [ ] 러닝 기록 생성 (`/records/new`)
- [ ] 러닝 코스 생성 (`/courses/new`)
- [ ] 피드 확인 (`/`)
- [ ] 프로필 확인 (`/profile`)

---

## 문제 발생 시

### 여전히 "서버 오류"가 발생한다면

1. **브라우저 개발자 도구 확인**
   - `F12` > Network 탭
   - `/api/auth/register` 요청 확인
   - Response에서 오류 메시지 확인

2. **Vercel 로그 확인**
   - Vercel 대시보드 > 배포 > Logs
   - 오류 메시지 확인

3. **환경 변수 확인**
   - Vercel > Settings > Environment Variables
   - Production 환경에 모든 변수가 추가되었는지 확인

---

## 일반적인 문제

### 문제 1: "Supabase 관리자 클라이언트가 초기화되지 않았습니다"

**원인:** `SUPABASE_SERVICE_ROLE_KEY` 환경 변수 문제

**해결:**
1. Vercel > Settings > Environment Variables
2. `SUPABASE_SERVICE_ROLE_KEY` 확인
3. Production 환경에 체크되어 있는지 확인
4. 값이 올바른지 확인 (Supabase 대시보드에서 복사)

### 문제 2: "Invalid API key"

**원인:** Supabase API 키 문제

**해결:**
1. Supabase 대시보드 > Settings > API
2. 키 확인 및 복사
3. Vercel 환경 변수 업데이트

### 문제 3: "relation 'users' does not exist"

**원인:** Supabase 스키마 문제

**해결:**
1. Supabase Table Editor에서 `users` 테이블 확인
2. 없으면 SQL Editor에서 스키마 생성

---

## 성공 확인 체크리스트

- [ ] 프로덕션에서 회원가입 성공
- [ ] 프로덕션에서 로그인 성공
- [ ] 메인 페이지(Feed) 접근 가능
- [ ] 프로필 페이지 접근 가능

---

## 다음 단계

1. ✅ 배포 완료 확인
2. ⏭️ 프로덕션에서 회원가입 테스트
3. ⏭️ 프로덕션에서 로그인 테스트
4. ⏭️ 다른 기능 테스트

**프로덕션에서 회원가입을 시도해보시고, 결과를 알려주세요!**
