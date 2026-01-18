# 프로덕션 회원가입 오류 디버깅

## 현재 상태

- ✅ Supabase `users` 테이블 존재 확인
- ❌ 프로덕션에서 회원가입 시 서버 오류 발생

---

## 다음 확인사항

### 1. 다른 테이블 확인

Supabase Table Editor에서 다음 테이블도 확인하세요:

- [ ] `users` ✅ (확인 완료)
- [ ] `courses`
- [ ] `running_records`
- [ ] `likes`
- [ ] `comments`

**참고:** 회원가입에는 `users` 테이블만 필요하지만, 다른 기능을 위해 나머지 테이블도 필요합니다.

### 2. Vercel 함수 로그 확인 (중요!)

가장 중요한 것은 실제 오류 메시지를 확인하는 것입니다:

1. **Vercel 대시보드 접속**
   - 프로젝트 선택

2. **Functions 탭 클릭**
   - 또는 "Deployments" > 실패한 배포 클릭

3. **함수 로그 확인**
   - `/api/auth/register` 함수 로그 확인
   - 오류 메시지 전체 확인

**찾아야 할 오류 메시지:**
- `relation "users" does not exist`
- `Supabase 관리자 클라이언트가 초기화되지 않았습니다`
- `Invalid API key`
- `permission denied`
- 기타 Supabase 연결 오류

### 3. Vercel 환경 변수 확인

1. **Vercel > Settings > Environment Variables**
2. 다음 변수가 **Production 환경에 추가**되었는지 확인:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

3. **변수 값 확인**
   - Supabase 대시보드의 값과 일치하는지 확인
   - 특히 `SUPABASE_SERVICE_ROLE_KEY`가 올바른지 확인

---

## 일반적인 오류와 해결

### 오류 1: "Supabase 관리자 클라이언트가 초기화되지 않았습니다"

**원인:** `SUPABASE_SERVICE_ROLE_KEY` 환경 변수가 없거나 잘못됨

**해결:**
1. Supabase 대시보드 > Settings > API > Secret keys > service_role 복사
2. Vercel > Settings > Environment Variables
3. `SUPABASE_SERVICE_ROLE_KEY` 추가/수정
4. **Production 환경에 체크** 확인
5. 재배포 (또는 자동 재배포 대기)

### 오류 2: "Invalid API key" 또는 "permission denied"

**원인:** Supabase API 키가 잘못되었거나 권한 문제

**해결:**
1. Supabase 대시보드 > Settings > API에서 키 확인
2. Vercel 환경 변수와 비교
3. 올바른 키로 업데이트

### 오류 3: "relation 'users' does not exist"

**원인:** 다른 Supabase 프로젝트를 사용 중이거나 스키마가 다른 프로젝트에 생성됨

**해결:**
1. Vercel 환경 변수의 `NEXT_PUBLIC_SUPABASE_URL` 확인
2. Supabase 대시보드의 Project URL과 일치하는지 확인
3. 올바른 프로젝트에 스키마 생성 확인

---

## 단계별 디버깅

### Step 1: Vercel 함수 로그 확인

1. Vercel 대시보드 > 프로젝트 > Functions
2. `/api/auth/register` 함수 로그 확인
3. **오류 메시지 전체 복사**

### Step 2: 환경 변수 확인

1. Vercel > Settings > Environment Variables
2. Supabase 변수 확인
3. Production 환경에 추가되었는지 확인

### Step 3: Supabase 프로젝트 확인

1. Vercel 환경 변수의 `NEXT_PUBLIC_SUPABASE_URL` 확인
2. Supabase 대시보드의 Project URL과 일치하는지 확인

---

## 빠른 체크리스트

- [x] Supabase `users` 테이블 존재 확인
- [ ] Vercel 함수 로그 확인 (오류 메시지)
- [ ] Vercel 환경 변수 확인 (Production 환경)
- [ ] Supabase 프로젝트 URL 일치 확인

---

## 도움 요청 시 제공할 정보

문제가 계속되면 다음 정보를 제공해주세요:

1. **Vercel 함수 로그의 오류 메시지** (전체)
2. **환경 변수 추가 여부** (Production 환경)
3. **Supabase 프로젝트 URL 일치 여부**

---

## 다음 단계

1. ✅ Supabase `users` 테이블 확인 완료
2. ⏭️ Vercel 함수 로그 확인 (가장 중요!)
3. ⏭️ Vercel 환경 변수 확인
4. ⏭️ 프로덕션에서 회원가입 재시도

**가장 중요한 것은 Vercel 함수 로그의 실제 오류 메시지를 확인하는 것입니다!**

Vercel 함수 로그의 오류 메시지를 알려주시면 더 구체적으로 도와드릴 수 있습니다.
