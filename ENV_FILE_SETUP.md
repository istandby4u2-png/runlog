# .env 파일 생성 및 설정 완전 가이드

## 방법 1: 터미널에서 직접 생성 (추천)

### 1단계: 프로젝트 디렉토리로 이동

터미널에서 다음 명령 실행:

```bash
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"
```

### 2단계: .env 파일 생성

터미널에서 다음 명령 실행:

```bash
touch .env
```

### 3단계: .env 파일 편집

#### 옵션 A: nano 에디터 사용 (터미널 내에서 편집)

```bash
nano .env
```

**nano 사용법:**
1. 파일이 열리면 아래 템플릿을 복사하여 붙여넣기
2. 실제 값으로 교체
3. `Ctrl + O` (저장)
4. `Enter` (확인)
5. `Ctrl + X` (종료)

#### 옵션 B: vim 에디터 사용

```bash
vim .env
```

**vim 사용법:**
1. `i` 키를 눌러 편집 모드 진입
2. 아래 템플릿을 붙여넣기
3. 실제 값으로 교체
4. `Esc` 키를 눌러 명령 모드로 전환
5. `:wq` 입력 후 `Enter` (저장하고 종료)

#### 옵션 C: VS Code 또는 다른 에디터 사용

```bash
code .env
```

또는 Finder에서:
1. Finder에서 프로젝트 폴더 열기
2. `.env` 파일을 텍스트 에디터로 열기

---

## 방법 2: 텍스트 에디터로 직접 생성

### 1단계: Finder에서 프로젝트 폴더 열기

1. Finder 열기
2. 경로 이동: `/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서`

### 2단계: 새 파일 생성

1. 프로젝트 폴더에서 우클릭
2. "새 문서" > "텍스트 문서" 선택
3. 파일 이름을 `.env`로 변경 (앞에 점 포함)
4. 텍스트 에디터로 열기

**주의**: macOS에서 `.env` 파일이 보이지 않으면:
- Finder에서 `Cmd + Shift + .` (숨김 파일 표시)
- 또는 터미널에서 `touch .env` 명령 사용

---

## .env 파일 템플릿

아래 템플릿을 복사하여 `.env` 파일에 붙여넣고, 실제 값으로 교체하세요:

```env
# Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyCz-ZPlMtzFjkXvGuV0HP22sWupJp7uL_4

# JWT Secret (터미널에서 생성: openssl rand -base64 32)
JWT_SECRET=여기에_생성한_랜덤_문자열_붙여넣기

# Gemini API
GEMINI_API_KEY=AIzaSyCz-ZPlMtzFjkXvGuV0HP22sWupJp7uL_4

# Supabase (Supabase 대시보드 > Settings > API에서 복사)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Cloudinary (Cloudinary Dashboard에서 복사)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

---

## 각 변수 값 찾는 방법

### 1. NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
- 이미 가지고 계신 키: `AIzaSyCz-ZPlMtzFjkXvGuV0HP22sWupJp7uL_4`

### 2. JWT_SECRET
터미널에서 생성:
```bash
openssl rand -base64 32
```
출력된 문자열을 복사하여 사용

### 3. GEMINI_API_KEY
- 이미 가지고 계신 키: `AIzaSyCz-ZPlMtzFjkXvGuV0HP22sWupJp7uL_4`

### 4. Supabase 변수들
1. Supabase 대시보드 접속
2. Settings > API 메뉴
3. **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
4. **Publishable key (anon public)** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. **Secret keys > service_role** → `SUPABASE_SERVICE_ROLE_KEY`

### 5. Cloudinary 변수들
1. Cloudinary Dashboard 접속
2. **Cloud name** → `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
3. **API Key** → `CLOUDINARY_API_KEY`
4. **API Secret** → `CLOUDINARY_API_SECRET`

---

## .env 파일 예시 (실제 값 포함)

```env
# Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyCz-ZPlMtzFjkXvGuV0HP22sWupJp7uL_4

# JWT Secret
JWT_SECRET=vF91e5Ej8Kij33Wv6YzVQw7nSle63DZpq3TxZFkWKik=

# Gemini API
GEMINI_API_KEY=AIzaSyCz-ZPlMtzFjkXvGuV0HP22sWupJp7uL_4

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.abcdefghijklmnopqrstuvwxyz1234567890
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjE2MjM5MDIyLCJleHAiOjE5MzE4MTUwMjJ9.abcdefghijklmnopqrstuvwxyz1234567890

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dxxxxx
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz1234567890
```

---

## 파일 저장 및 확인

### 저장 확인

터미널에서:

```bash
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"
cat .env
```

또는 특정 변수만 확인:

```bash
grep JWT_SECRET .env
grep SUPABASE .env
```

### 파일 권한 확인

`.env` 파일이 올바르게 생성되었는지 확인:

```bash
ls -la .env
```

출력 예시:
```
-rw-r--r--  1 user  staff  1234 Jan 18 10:30 .env
```

---

## 주의사항

### ⚠️ 보안
- **절대 GitHub에 커밋하지 마세요!**
- `.env` 파일은 `.gitignore`에 포함되어 있어야 합니다
- 실제 키 값은 공유하지 마세요

### ✅ 형식
- 각 변수는 `KEY=value` 형식
- `=` 앞뒤에 공백 없음
- 주석은 `#`으로 시작
- 따옴표 없이 값만 입력

### ✅ 대소문자
- 변수 이름은 대소문자를 정확히 입력
- `NEXT_PUBLIC_` 접두사는 반드시 포함

---

## 문제 해결

### .env 파일이 보이지 않나요?
```bash
# 숨김 파일 표시
ls -la | grep .env
```

### 파일이 저장되지 않나요?
- 파일 권한 확인: `chmod 644 .env`
- 디스크 공간 확인
- 에디터에서 명시적으로 저장 (`Cmd + S`)

### 환경 변수가 로드되지 않나요?
1. `.env` 파일이 프로젝트 루트에 있는지 확인
2. 파일 이름이 정확히 `.env`인지 확인 (`.env.local` 아님)
3. 개발 서버 재시작: `npm run dev`

---

## 다음 단계

`.env` 파일 생성 완료 후:
1. ✅ 모든 변수 값 확인
2. ✅ 파일 저장
3. ✅ 개발 서버 재시작: `npm run dev`
4. ✅ 로컬에서 테스트
5. ✅ Vercel 배포 시 환경 변수도 설정
