# Internal Server Error 해결 가이드

## 1단계: 터미널 로그 확인

개발 서버를 실행한 터미널 창을 확인하세요. 오류 메시지가 표시되어 있을 것입니다.

일반적인 오류 메시지:
- `Supabase 관리자 클라이언트가 초기화되지 않았습니다`
- `Cloudinary가 설정되지 않았습니다`
- `GEMINI_API_KEY가 설정되지 않았습니다`
- `JWT_SECRET이 설정되지 않았습니다`

---

## 2단계: 환경 변수 확인

### .env 파일 확인

터미널에서:

```bash
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"
cat .env
```

또는 각 변수 확인:

```bash
# Supabase 확인
grep SUPABASE .env

# Cloudinary 확인
grep CLOUDINARY .env

# JWT 확인
grep JWT_SECRET .env

# Gemini 확인
grep GEMINI .env
```

### 필수 환경 변수 체크리스트

다음 변수들이 모두 설정되어 있어야 합니다:

- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- [ ] `JWT_SECRET`
- [ ] `GEMINI_API_KEY`
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- [ ] `CLOUDINARY_API_KEY`
- [ ] `CLOUDINARY_API_SECRET`

---

## 3단계: 일반적인 오류 해결

### 오류 1: Supabase 연결 실패

**증상:**
```
Supabase 관리자 클라이언트가 초기화되지 않았습니다
```

**해결:**
1. `.env` 파일에 Supabase 변수가 모두 설정되어 있는지 확인
2. Supabase 대시보드에서 Project URL과 API 키가 올바른지 확인
3. 개발 서버 재시작

### 오류 2: Cloudinary 연결 실패

**증상:**
```
Cloudinary가 설정되지 않았습니다
```

**해결:**
1. `.env` 파일에 Cloudinary 변수가 모두 설정되어 있는지 확인
2. Cloudinary Dashboard에서 정보가 올바른지 확인
3. 개발 서버 재시작

### 오류 3: 데이터베이스 테이블 없음

**증상:**
```
relation "users" does not exist
```

**해결:**
1. Supabase 대시보드 > SQL Editor로 이동
2. `SUPABASE_SCHEMA_SETUP.md` 파일의 SQL 스크립트 실행
3. Table Editor에서 테이블이 생성되었는지 확인

### 오류 4: 환경 변수 로드 실패

**증상:**
```
process.env.XXX is undefined
```

**해결:**
1. `.env` 파일이 프로젝트 루트에 있는지 확인
2. 파일 이름이 정확히 `.env`인지 확인 (`.env.local` 아님)
3. 개발 서버 재시작 (`Ctrl + C` 후 `npm run dev`)

---

## 4단계: 개발 서버 재시작

환경 변수를 수정한 후 반드시 서버를 재시작하세요:

```bash
# 1. 서버 중지 (터미널에서 Ctrl + C)

# 2. 프로젝트 디렉토리로 이동
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"

# 3. 서버 재시작
npm run dev
```

---

## 5단계: 브라우저 콘솔 확인

브라우저에서 `F12` 또는 `Cmd + Option + I`를 눌러 개발자 도구를 열고:

1. **Console** 탭에서 JavaScript 오류 확인
2. **Network** 탭에서 실패한 API 요청 확인
3. 실패한 요청을 클릭하여 상세 오류 메시지 확인

---

## 6단계: 단계별 테스트

### 테스트 1: 환경 변수 로드 확인

브라우저 콘솔에서 (개발 모드에서만):
```javascript
console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)
```

### 테스트 2: Supabase 연결 확인

Supabase 대시보드 > Table Editor에서 테이블이 보이는지 확인

### 테스트 3: API 엔드포인트 테스트

브라우저에서:
- `http://localhost:3000/api/calories/test` 접속
- JSON 응답 확인

---

## 빠른 체크리스트

문제 해결 전 확인사항:

1. ✅ `.env` 파일이 프로젝트 루트에 있나요?
2. ✅ 모든 환경 변수가 설정되어 있나요?
3. ✅ Supabase 스키마가 생성되었나요?
4. ✅ 개발 서버를 재시작했나요?
5. ✅ 터미널 로그에 오류 메시지가 있나요?

---

## 도움 요청 시 제공할 정보

문제가 계속되면 다음 정보를 제공해주세요:

1. 터미널의 전체 오류 메시지
2. 브라우저 콘솔의 오류 메시지
3. `.env` 파일의 변수 이름 목록 (값은 제외)
4. Supabase 스키마 생성 여부
5. 어떤 페이지에서 오류가 발생하는지
