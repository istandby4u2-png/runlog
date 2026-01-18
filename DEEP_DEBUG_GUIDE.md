# 심층 디버깅 가이드

## 현재 상황

- 환경 변수 모두 설정 완료
- 여전히 "서버 오류가 발생했습니다" 오류 발생
- 다른 원인 확인 필요

---

## 가능한 원인들

### 원인 1: Supabase 스키마 문제

**확인 방법:**
1. Supabase 대시보드 > Table Editor
2. 다음 테이블이 모두 있는지 확인:
   - `users`
   - `courses`
   - `running_records`
   - `likes`
   - `comments`

**해결:**
- 테이블이 없으면 SQL Editor에서 스키마 생성
- `SUPABASE_SCHEMA_SETUP.md` 파일 참고

---

### 원인 2: Supabase RLS (Row Level Security) 정책

**확인 방법:**
1. Supabase 대시보드 > Authentication > Policies
2. 각 테이블에 RLS 정책이 설정되어 있는지 확인

**해결:**
- `service_role` 키를 사용하면 RLS를 우회해야 하지만, 확인 필요
- 필요하면 RLS 비활성화 또는 정책 수정

---

### 원인 3: Vercel 재배포 미완료

**확인 방법:**
1. Vercel 대시보드 > Deployments
2. 최근 배포 상태 확인
3. "Ready" 상태인지 확인

**해결:**
- 재배포가 완료될 때까지 대기
- 필요하면 수동 재배포

---

### 원인 4: 실제 오류 메시지 미확인

**가장 중요!** 실제 오류 메시지를 확인해야 합니다.

**확인 방법:**
1. Vercel 대시보드 > Logs
2. 오류 로그 확인
3. 상세 오류 메시지 확인

---

## Vercel 함수 로그 확인 방법

### Step 1: Vercel 대시보드 접속

1. **Vercel 대시보드 접속**
   - https://vercel.com/dashboard
   - 로그인

2. **프로젝트 선택**
   - `runlog` 프로젝트 클릭

### Step 2: Logs 확인

1. **"Logs" 탭 클릭**
   - 프로젝트 페이지에서 "Logs" 탭 클릭
   - 또는 Deployments > 최근 배포 > "Logs" 클릭

2. **오류 로그 찾기**
   - 실패한 API 요청의 로그 확인
   - 예: `/api/auth/login`, `/api/records`, `/api/calories`
   - 빨간색으로 표시된 오류 로그 확인

3. **상세 오류 메시지 확인**
   - 오류 로그 클릭하여 상세 정보 확인
   - 오류 메시지 전체 복사

---

## Supabase 스키마 확인

### Step 1: Supabase Table Editor 확인

1. **Supabase 대시보드 접속**
   - https://supabase.com/dashboard
   - 프로젝트 선택

2. **Table Editor 확인**
   - 왼쪽 사이드바에서 "Table Editor" 클릭
   - 다음 테이블이 모두 있는지 확인:
     - `users`
     - `courses`
     - `running_records`
     - `likes`
     - `comments`

### Step 2: 테이블이 없으면 생성

1. **SQL Editor 접속**
   - 왼쪽 사이드바에서 "SQL Editor" 클릭

2. **스키마 생성 SQL 실행**
   - `SUPABASE_SCHEMA_SETUP.md` 파일의 SQL 스크립트 복사
   - SQL Editor에 붙여넣기
   - "Run" 버튼 클릭

---

## Supabase RLS 정책 확인

### Step 1: Authentication > Policies 확인

1. **Supabase 대시보드 접속**
2. **Authentication > Policies 메뉴 클릭**
3. **각 테이블의 RLS 정책 확인**

### Step 2: RLS 비활성화 (필요한 경우)

**주의:** `service_role` 키를 사용하면 RLS를 우회해야 하지만, 확인이 필요합니다.

1. **Table Editor에서 테이블 선택**
2. **"RLS" 토글 확인**
3. **필요하면 비활성화**

---

## 실제 오류 메시지 확인 (가장 중요!)

### 방법 1: Vercel 함수 로그

1. **Vercel 대시보드 > Logs**
2. **오류 로그 확인**
3. **상세 오류 메시지 복사**

### 방법 2: 브라우저 개발자 도구

1. **프로덕션 URL에서 작업 시도**
2. **브라우저 개발자 도구 열기** (`F12`)
3. **Network 탭 > 실패한 요청 > Response 확인**
4. **오류 메시지 복사**

---

## 일반적인 오류 메시지와 해결

### 오류 1: "relation 'users' does not exist"

**의미:** Supabase 테이블이 없음

**해결:**
1. Supabase Table Editor에서 테이블 확인
2. 없으면 SQL Editor에서 스키마 생성

---

### 오류 2: "permission denied" 또는 "new row violates row-level security policy"

**의미:** RLS 정책 문제

**해결:**
1. Supabase > Authentication > Policies 확인
2. `service_role` 키 사용 시 RLS 우회 확인
3. 필요하면 RLS 비활성화

---

### 오류 3: "Invalid API key" 또는 "API key not found"

**의미:** Supabase API 키 문제

**해결:**
1. Vercel 환경 변수에서 `SUPABASE_SERVICE_ROLE_KEY` 확인
2. Supabase 대시보드에서 키 재확인
3. 값이 올바른지 확인

---

### 오류 4: "connection timeout" 또는 "network error"

**의미:** 네트워크 연결 문제

**해결:**
1. Supabase 프로젝트 상태 확인
2. Vercel 함수 타임아웃 설정 확인

---

## 디버깅 체크리스트

- [ ] Vercel 함수 로그에서 실제 오류 메시지 확인
- [ ] Supabase Table Editor에서 모든 테이블 존재 확인
- [ ] Supabase RLS 정책 확인
- [ ] Vercel 재배포 완료 확인
- [ ] 환경 변수 값 재확인
- [ ] Supabase 프로젝트 상태 확인

---

## 다음 단계

1. ⏭️ **Vercel 함수 로그 확인** (가장 중요!)
2. ⏭️ **Supabase Table Editor에서 테이블 확인**
3. ⏭️ **실제 오류 메시지 확인**
4. ⏭️ **오류 메시지에 따른 해결**

**가장 중요한 것은 Vercel 함수 로그에서 실제 오류 메시지를 확인하는 것입니다!**

Vercel 대시보드 > Logs에서 오류 로그를 확인하고, 상세 오류 메시지를 알려주세요. 그러면 더 구체적으로 도와드릴 수 있습니다.
