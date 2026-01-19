# 🔍 로그인 실패 디버깅 가이드

## 문제 상황

재배포 후 로그인 시 "이메일 또는 비밀번호가 올바르지 않습니다" 오류 발생

---

## 🔍 가능한 원인

### 1. Supabase Service Role Key 미적용 (가장 가능성 높음)

**증상:**
- 로그인 API가 Supabase에 연결하지 못함
- 사용자 조회 실패

**확인 방법:**
- Vercel 함수 로그에서 "Supabase 관리자 클라이언트가 초기화되지 않았습니다" 오류 확인

### 2. 환경 변수가 재배포에 적용되지 않음

**증상:**
- 환경 변수는 업데이트했지만 재배포하지 않음
- 기존 배포가 여전히 이전 키 사용

**확인 방법:**
- Vercel Dashboard에서 최신 배포 확인
- 환경 변수 변경 후 재배포했는지 확인

### 3. 환경 변수가 모든 환경에 적용되지 않음

**증상:**
- Production 환경에만 적용
- Preview/Development 환경에 미적용

**확인 방법:**
- Vercel Dashboard > Settings > Environment Variables
- 각 변수의 환경 아이콘 확인

### 4. Supabase 연결 문제

**증상:**
- Supabase 서비스 자체 문제
- 네트워크 문제

**확인 방법:**
- Supabase Dashboard 접속 확인
- Vercel 함수 로그 확인

---

## 🛠️ 해결 방법

### Step 1: Vercel 함수 로그 확인

1. **Vercel Dashboard 접속**
   - [vercel.com/dashboard](https://vercel.com/dashboard)
   - 프로젝트 선택

2. **Functions 탭 이동**
   - 상단 탭 메뉴에서 **Functions** 클릭
   - 또는 **Deployments** > 최신 배포 > **Functions** 탭

3. **로그인 API 로그 확인**
   - `/api/auth/login` 함수 찾기
   - 최근 실행 로그 클릭
   - 다음 오류 메시지 확인:
     - `❌ Supabase 관리자 클라이언트가 초기화되지 않았습니다.`
     - `❌ SUPABASE_SERVICE_ROLE_KEY를 확인해주세요.`
     - `User findByEmail error: ...`

4. **로그 내용 확인**
   - 오류 메시지 전체 확인
   - 스택 트레이스 확인

### Step 2: Vercel 환경 변수 재확인

1. **Vercel Dashboard > Settings > Environment Variables**

2. **다음 변수 확인:**
   - `SUPABASE_SERVICE_ROLE_KEY` - 값이 새 키인지 확인
   - `NEXT_PUBLIC_SUPABASE_URL` - 값이 올바른지 확인
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - 값이 새 키인지 확인

3. **환경 확인:**
   - 각 변수 옆의 환경 아이콘 확인
   - **Production, Preview, Development 모두 체크**되어 있어야 함

4. **변수 값 확인:**
   - 변수 클릭하여 값 확인
   - 새 키 값이 정확히 입력되었는지 확인
   - 공백이나 특수문자 없음 확인

### Step 3: 환경 변수 재설정 (필요한 경우)

#### 방법 1: 변수 수정

1. 변수 클릭 > **Edit**
2. 값 재입력 (복사-붙여넣기)
3. 모든 환경 체크 확인
4. **Save**

#### 방법 2: 변수 삭제 후 재생성

1. 변수 삭제
2. **Add New** 클릭
3. 변수 이름 입력
4. 새 값 입력
5. 모든 환경 체크
6. **Save**

### Step 4: 강제 재배포

환경 변수를 수정한 후 **반드시 재배포**해야 합니다:

1. **Vercel Dashboard > Deployments**
2. 최신 배포의 **"..."** 메뉴 클릭
3. **Redeploy** 선택
4. 배포 완료 대기 (2-5분)

### Step 5: Supabase 연결 테스트

#### Supabase Dashboard에서 확인

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택
3. **Table Editor** 이동
4. `users` 테이블 확인
5. 사용자 데이터가 있는지 확인

#### Vercel 함수에서 테스트

1. Vercel Dashboard > **Functions** 탭
2. `/api/auth/login` 함수 찾기
3. 최근 실행 로그 확인
4. Supabase 연결 오류 확인

---

## 🔧 즉시 해결 방법

### 방법 1: 환경 변수 재확인 및 재배포

1. **Vercel Dashboard > Settings > Environment Variables**
2. `SUPABASE_SERVICE_ROLE_KEY` 확인:
   - 값이 새 키인지 확인
   - 모든 환경에 적용되었는지 확인
3. **변수 수정 (필요한 경우):**
   - 변수 클릭 > Edit
   - 값 재입력
   - 모든 환경 체크
   - Save
4. **재배포:**
   - Deployments > 최신 배포 > "..." > Redeploy
5. **배포 완료 대기**
6. **로그인 재시도**

### 방법 2: Supabase 키 재확인

1. **Supabase Dashboard > Settings > API**
2. **현재 Service Role Key 확인**
3. **Vercel 환경 변수와 비교:**
   - Vercel Dashboard > Settings > Environment Variables
   - `SUPABASE_SERVICE_ROLE_KEY` 값 확인
   - Supabase의 Service Role Key와 일치하는지 확인
4. **일치하지 않으면:**
   - Vercel에서 변수 수정
   - 재배포

### 방법 3: 회원가입으로 테스트

기존 계정이 작동하지 않는다면:

1. **새 계정으로 회원가입 시도**
2. **회원가입 성공 여부 확인:**
   - 성공: Supabase 연결 정상, 기존 계정 문제
   - 실패: Supabase 연결 문제

---

## 📊 디버깅 체크리스트

### Vercel 환경 변수

- [ ] `SUPABASE_SERVICE_ROLE_KEY` 값이 새 키인가?
- [ ] `NEXT_PUBLIC_SUPABASE_URL` 값이 올바른가?
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` 값이 새 키인가?
- [ ] 모든 변수가 Production, Preview, Development에 적용되었는가?
- [ ] 환경 변수 변경 후 재배포했는가?

### Supabase

- [ ] Supabase Dashboard 접속 가능한가?
- [ ] `users` 테이블에 데이터가 있는가?
- [ ] Service Role Key가 올바른가?

### 배포

- [ ] 최신 배포가 완료되었는가? (Ready 상태)
- [ ] 배포 로그에 오류가 없는가?
- [ ] 함수 로그에 Supabase 연결 오류가 없는가?

---

## 🚨 긴급 해결 방법

### Step 1: Vercel 함수 로그 확인

1. Vercel Dashboard > **Functions** 탭
2. `/api/auth/login` 함수 클릭
3. 최근 실행 로그 확인
4. 오류 메시지 확인

**예상 오류:**
```
❌ Supabase 관리자 클라이언트가 초기화되지 않았습니다.
❌ SUPABASE_SERVICE_ROLE_KEY를 확인해주세요.
```

### Step 2: 환경 변수 즉시 수정

1. Vercel Dashboard > **Settings** > **Environment Variables**
2. `SUPABASE_SERVICE_ROLE_KEY` 찾기
3. 변수 클릭 > **Edit**
4. Supabase Dashboard에서 새 Service Role Key 복사
5. 값 입력
6. **모든 환경 체크 확인**
7. **Save**

### Step 3: 즉시 재배포

1. **Deployments** 탭 이동
2. 최신 배포 > **"..."** 메뉴 > **Redeploy**
3. 배포 완료 대기

### Step 4: 로그인 재시도

1. 브라우저에서 사이트 접속
2. 로그인 시도
3. 여전히 실패하면 함수 로그 재확인

---

## 🔍 상세 디버깅

### 브라우저 콘솔 확인

1. 브라우저에서 `F12` 또는 `Cmd + Option + I` (Mac)
2. **Console** 탭 확인
3. **Network** 탭 확인
4. `/api/auth/login` 요청 클릭
5. **Response** 탭에서 오류 메시지 확인

### Vercel 함수 로그 상세 확인

1. Vercel Dashboard > **Functions** 탭
2. `/api/auth/login` 함수 클릭
3. **Logs** 탭 확인
4. 다음 로그 확인:
   - `❌ Supabase 관리자 클라이언트가 초기화되지 않았습니다.`
   - `User findByEmail error: ...`
   - `Login error: ...`

---

## 💡 예방 조치

### 환경 변수 업데이트 시 체크리스트

1. ✅ **Supabase Dashboard에서 새 키 복사**
2. ✅ **Vercel Dashboard에서 변수 업데이트**
3. ✅ **모든 환경(Production, Preview, Development) 체크 확인**
4. ✅ **변수 값 정확히 입력 (공백 없음)**
5. ✅ **Save 클릭**
6. ✅ **재배포 실행**
7. ✅ **배포 완료 대기**
8. ✅ **로그인 테스트**

---

## 요약

1. 🔍 **Vercel 함수 로그 확인** - 오류 메시지 확인
2. ✅ **Vercel 환경 변수 재확인** - SUPABASE_SERVICE_ROLE_KEY 확인
3. 🔄 **환경 변수 재설정** (필요한 경우)
4. 🚀 **강제 재배포** - 반드시 재배포 필요
5. 🧪 **로그인 재시도** - 테스트

**가장 흔한 원인: 환경 변수 업데이트 후 재배포를 하지 않았거나, 모든 환경에 적용되지 않았을 가능성이 높습니다.**

---

## ⚠️ 중요 사항

1. **환경 변수는 즉시 적용되지 않습니다.** 재배포가 필수입니다.
2. **모든 환경(Production, Preview, Development)에 적용해야 합니다.**
3. **변수 값에 공백이나 특수문자가 없어야 합니다.**
4. **Supabase Service Role Key는 가장 중요한 변수입니다.**

**Vercel 함수 로그를 확인하면 정확한 원인을 파악할 수 있습니다!**
