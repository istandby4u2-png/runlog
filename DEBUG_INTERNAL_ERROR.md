# Internal Server Error 디버깅 가이드

## 즉시 확인할 사항

### 1. 터미널 로그 확인

개발 서버를 실행한 터미널 창에서 오류 메시지를 확인하세요.

**찾아야 할 오류 메시지:**
- `❌ Supabase 관리자 클라이언트가 초기화되지 않았습니다`
- `⚠️ Supabase 환경 변수가 설정되지 않았습니다`
- `⚠️ Cloudinary 환경 변수가 설정되지 않았습니다`
- `relation "users" does not exist`
- `Cannot read property 'from' of null`

### 2. 브라우저 콘솔 확인

1. 브라우저에서 `F12` 또는 `Cmd + Option + I` 눌러 개발자 도구 열기
2. **Console** 탭에서 JavaScript 오류 확인
3. **Network** 탭에서 실패한 요청 확인 (빨간색으로 표시)

---

## 단계별 진단

### Step 1: 환경 변수 로드 확인

터미널에서:

```bash
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"

# .env 파일 존재 확인
ls -la .env

# 환경 변수 확인 (값은 보이지 않지만 변수명 확인)
grep -E "^[A-Z_]+=" .env | cut -d= -f1
```

### Step 2: Supabase 연결 테스트

브라우저에서 다음 URL 접속:

```
http://localhost:3000/api/calories/test
```

또는 터미널에서:

```bash
curl http://localhost:3000/api/calories/test
```

### Step 3: Supabase 스키마 확인

1. Supabase 대시보드 > Table Editor
2. `users` 테이블이 있는지 확인
3. 없으면 SQL Editor에서 스키마 생성 필요

---

## 일반적인 오류와 해결

### 오류 1: "Supabase 관리자 클라이언트가 초기화되지 않았습니다"

**원인:** `SUPABASE_SERVICE_ROLE_KEY`가 설정되지 않았거나 잘못됨

**해결:**
1. `.env` 파일 확인:
   ```bash
   grep SUPABASE_SERVICE_ROLE_KEY .env
   ```
2. Supabase 대시보드 > Settings > API > Secret keys > service_role 복사
3. `.env` 파일에 올바르게 설정
4. 서버 재시작

### 오류 2: "relation 'users' does not exist"

**원인:** Supabase 스키마가 생성되지 않음

**해결:**
1. Supabase 대시보드 > SQL Editor
2. `SUPABASE_SCHEMA_SETUP.md` 파일의 SQL 스크립트 실행
3. Table Editor에서 테이블 생성 확인

### 오류 3: "Cloudinary가 설정되지 않았습니다"

**원인:** Cloudinary 환경 변수 누락

**해결:**
1. `.env` 파일에 Cloudinary 변수 확인
2. Cloudinary Dashboard에서 정보 확인
3. 서버 재시작

### 오류 4: 환경 변수가 로드되지 않음

**원인:** `.env` 파일 위치 또는 형식 오류

**해결:**
1. `.env` 파일이 프로젝트 루트에 있는지 확인
2. 파일 이름이 정확히 `.env`인지 확인 (`.env.local` 아님)
3. 각 줄이 `KEY=value` 형식인지 확인 (공백 없음)
4. 서버 재시작

---

## 빠른 체크리스트

- [ ] `.env` 파일이 프로젝트 루트에 있나요?
- [ ] 모든 환경 변수가 설정되어 있나요? (값이 비어있지 않나요?)
- [ ] Supabase 스키마가 생성되었나요?
- [ ] 개발 서버를 재시작했나요?
- [ ] 터미널에 오류 메시지가 있나요?

---

## 도움 요청 시 제공할 정보

문제가 계속되면 다음 정보를 제공해주세요:

1. **터미널의 전체 오류 메시지** (스크린샷 또는 복사)
2. **브라우저 콘솔의 오류 메시지**
3. **어떤 페이지에서 오류 발생** (로그인, 홈, 기록 등록 등)
4. **Supabase 스키마 생성 여부**
