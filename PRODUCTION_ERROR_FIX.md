# 프로덕션 서버 오류 해결 가이드

## 오류 상황

- ❌ 프로덕션 URL에서 회원가입 시 "서버 오류가 발생했습니다" 메시지

---

## 가장 가능성 높은 원인: Supabase 스키마 미생성

프로덕션 환경에서도 Supabase 데이터베이스 스키마가 필요합니다.

---

## 해결 방법

### 1단계: Supabase 스키마 생성 확인

1. **Supabase 대시보드 접속**
   - [supabase.com](https://supabase.com) 로그인
   - 프로젝트 선택

2. **Table Editor 확인**
   - 왼쪽 사이드바 > **"Table Editor"** 클릭
   - 다음 테이블이 있는지 확인:
     - ✅ `users`
     - ✅ `courses`
     - ✅ `running_records`
     - ✅ `likes`
     - ✅ `comments`

### 2단계: 스키마 생성 (테이블이 없다면)

1. **SQL Editor 열기**
   - 왼쪽 사이드바 > **"SQL Editor"** 클릭
   - **"New query"** 버튼 클릭

2. **SQL 스크립트 실행**
   - `SUPABASE_SCHEMA_SETUP.md` 파일의 SQL 스크립트 복사
   - SQL Editor에 붙여넣기
   - **"Run"** 버튼 클릭 (또는 `Cmd + Enter`)

3. **테이블 생성 확인**
   - Table Editor에서 테이블이 생성되었는지 확인

---

## 추가 확인사항

### 1. Vercel 환경 변수 확인

Vercel 대시보드에서:

1. **프로젝트 > Settings > Environment Variables**
2. 다음 변수가 모두 추가되었는지 확인:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

3. **Production 환경에 추가되었는지 확인**
   - 각 변수의 "Production" 체크박스 확인

### 2. Vercel 함수 로그 확인

1. **Vercel 대시보드 > 프로젝트 > Functions**
2. **실패한 요청 클릭**
3. **로그 확인**
   - 오류 메시지 확인
   - Supabase 연결 오류인지 확인

---

## 일반적인 오류와 해결

### 오류 1: "relation 'users' does not exist"

**원인:** Supabase 스키마가 생성되지 않음

**해결:**
1. Supabase 대시보드 > SQL Editor
2. `SUPABASE_SCHEMA_SETUP.md` 파일의 SQL 스크립트 실행

### 오류 2: "Supabase 관리자 클라이언트가 초기화되지 않았습니다"

**원인:** 환경 변수 누락 또는 잘못됨

**해결:**
1. Vercel > Settings > Environment Variables
2. `SUPABASE_SERVICE_ROLE_KEY` 확인
3. Production 환경에 추가되었는지 확인

### 오류 3: "Invalid API key"

**원인:** Supabase API 키가 잘못됨

**해결:**
1. Supabase 대시보드 > Settings > API
2. API 키 확인 및 복사
3. Vercel 환경 변수 업데이트

---

## 단계별 해결

### Step 1: Supabase 스키마 생성

1. Supabase 대시보드 > SQL Editor
2. `SUPABASE_SCHEMA_SETUP.md` 파일의 SQL 스크립트 실행
3. Table Editor에서 테이블 확인

### Step 2: Vercel 환경 변수 확인

1. Vercel > Settings > Environment Variables
2. Supabase 변수 확인
3. Production 환경에 추가되었는지 확인

### Step 3: 재시도

1. 프로덕션 URL에서 회원가입 다시 시도
2. 오류가 계속되면 Vercel 함수 로그 확인

---

## 빠른 체크리스트

- [ ] Supabase 스키마 생성 확인 (Table Editor)
- [ ] Vercel 환경 변수 확인 (Production 환경)
- [ ] Vercel 함수 로그 확인
- [ ] 프로덕션에서 회원가입 재시도

---

## 도움 요청 시 제공할 정보

문제가 계속되면 다음 정보를 제공해주세요:

1. **Vercel 함수 로그의 오류 메시지** (전체)
2. **Supabase 스키마 생성 여부** (Table Editor에서 확인)
3. **환경 변수 추가 여부** (Vercel에서 확인)

---

## 다음 단계

1. ✅ Supabase 스키마 생성
2. ✅ Vercel 환경 변수 확인
3. ✅ 프로덕션에서 회원가입 재시도

문제가 계속되면 Vercel 함수 로그의 오류 메시지를 알려주세요!
