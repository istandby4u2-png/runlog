# Internal Server Error 빠른 해결 가이드

## 즉시 확인할 사항

### 1. 터미널 로그 확인

개발 서버를 실행한 터미널 창을 확인하세요. 다음과 같은 오류 메시지가 보일 수 있습니다:

```
⚠️ Supabase 환경 변수가 설정되지 않았습니다.
❌ Supabase 관리자 클라이언트가 초기화되지 않았습니다.
⚠️ Cloudinary 환경 변수가 설정되지 않았습니다.
```

### 2. 환경 변수 빠른 확인

터미널에서 다음 명령 실행:

```bash
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"

# 환경 변수 확인
echo "=== Supabase ==="
grep SUPABASE .env | head -3
echo ""
echo "=== Cloudinary ==="
grep CLOUDINARY .env | head -3
echo ""
echo "=== JWT ==="
grep JWT_SECRET .env
```

### 3. 가장 흔한 원인과 해결

#### 원인 1: Supabase 환경 변수 누락

**확인:**
```bash
grep SUPABASE .env
```

**해결:**
`.env` 파일에 다음이 모두 있어야 합니다:
- `NEXT_PUBLIC_SUPABASE_URL=`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=`
- `SUPABASE_SERVICE_ROLE_KEY=`

#### 원인 2: Cloudinary 환경 변수 누락

**확인:**
```bash
grep CLOUDINARY .env
```

**해결:**
`.env` 파일에 다음이 모두 있어야 합니다:
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=`
- `CLOUDINARY_API_KEY=`
- `CLOUDINARY_API_SECRET=`

#### 원인 3: Supabase 스키마 미생성

**확인:**
1. Supabase 대시보드 > Table Editor
2. `users`, `courses`, `running_records` 테이블이 있는지 확인

**해결:**
1. Supabase 대시보드 > SQL Editor
2. `SUPABASE_SCHEMA_SETUP.md` 파일의 SQL 스크립트 실행

#### 원인 4: 서버 재시작 필요

환경 변수를 수정한 후 서버를 재시작하지 않았을 수 있습니다.

**해결:**
```bash
# 1. 서버 중지 (Ctrl + C)
# 2. 재시작
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"
npm run dev
```

---

## 단계별 해결

### Step 1: 환경 변수 체크

```bash
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"

# 필수 변수 확인
cat .env | grep -E "^(NEXT_PUBLIC_SUPABASE_URL|NEXT_PUBLIC_SUPABASE_ANON_KEY|SUPABASE_SERVICE_ROLE_KEY|NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME|CLOUDINARY_API_KEY|CLOUDINARY_API_SECRET|JWT_SECRET)="
```

모든 변수가 출력되어야 합니다.

### Step 2: 값이 비어있는지 확인

```bash
# 빈 값 확인
grep "=$" .env
```

빈 값이 있으면 실제 값으로 채워야 합니다.

### Step 3: 서버 재시작

```bash
# 서버 중지 후
npm run dev
```

---

## 완전한 .env 파일 예시

```env
# Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyCz-ZPlMtzFjkXvGuV0HP22sWupJp7uL_4

# JWT Secret
JWT_SECRET=vF91e5Ej8Kij33Wv6YzVQw7nSle63DZpq3TxZFkWKik=

# Gemini API
GEMINI_API_KEY=AIzaSyCz-ZPlMtzFjkXvGuV0HP22sWupJp7uL_4

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=xxxxx
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz1234567890
```

---

## 도움 요청 시 제공할 정보

문제가 계속되면 다음을 알려주세요:

1. **터미널의 오류 메시지** (전체)
2. **환경 변수 이름 목록** (값은 제외):
   ```bash
   grep -E "^(NEXT_PUBLIC_|JWT_|GEMINI_|SUPABASE_|CLOUDINARY_)" .env | cut -d= -f1
   ```
3. **어떤 페이지에서 오류 발생** (로그인, 홈, 기록 등록 등)
