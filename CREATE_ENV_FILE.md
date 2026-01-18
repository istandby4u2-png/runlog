# .env 파일 생성 방법

## 방법 1: 터미널에서 직접 생성 (가장 쉬움)

### 1단계: 프로젝트 디렉토리로 이동

터미널에서:

```bash
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"
```

### 2단계: .env 파일 생성

터미널에서 다음 명령 실행:

```bash
touch .env
```

### 3단계: .env 파일 편집

터미널에서 nano 에디터로 열기:

```bash
nano .env
```

**nano 사용법:**
1. 아래 템플릿을 복사하여 붙여넣기 (`Cmd + V`)
2. 실제 값으로 교체
3. `Ctrl + O` (저장)
4. `Enter` (확인)
5. `Ctrl + X` (종료)

---

## 방법 2: VS Code로 생성

### 1단계: VS Code로 프로젝트 열기

터미널에서:

```bash
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"
code .
```

### 2단계: 새 파일 생성

1. VS Code에서 왼쪽 파일 탐색기에서 프로젝트 루트 클릭
2. 새 파일 아이콘 클릭
3. 파일 이름 입력: `.env` (앞에 점 포함!)

### 3단계: 내용 입력

아래 템플릿을 복사하여 붙여넣고 실제 값으로 교체

---

## 방법 3: Finder에서 생성

### 1단계: 숨김 파일 표시

Finder에서:
- `Cmd + Shift + .` (점 키)를 눌러 숨김 파일 표시

### 2단계: 프로젝트 폴더 열기

Finder에서 경로 이동:
```
/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서
```

### 3단계: 새 파일 생성

1. 프로젝트 폴더에서 우클릭
2. "새 문서" > "텍스트 문서" 선택
3. 파일 이름을 `.env`로 변경 (앞에 점 포함!)

### 4단계: 텍스트 에디터로 열기

`.env` 파일을 더블클릭하여 텍스트 에디터로 열기

---

## .env 파일 템플릿

아래 내용을 복사하여 `.env` 파일에 붙여넣으세요:

```env
# Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyCz-ZPlMtzFjkXvGuV0HP22sWupJp7uL_4

# JWT Secret (터미널에서 생성: openssl rand -base64 32)
JWT_SECRET=

# Gemini API
GEMINI_API_KEY=AIzaSyCz-ZPlMtzFjkXvGuV0HP22sWupJp7uL_4

# Supabase (Supabase 대시보드 > Settings > API에서 복사)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Cloudinary (Cloudinary Dashboard에서 복사)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

---

## 각 변수 값 채우기

### 1. JWT_SECRET 생성

터미널에서:

```bash
openssl rand -base64 32
```

출력된 문자열을 복사하여 `JWT_SECRET=` 뒤에 붙여넣기

### 2. Supabase 변수

1. Supabase 대시보드 > Settings > API
2. **Project URL** → `NEXT_PUBLIC_SUPABASE_URL=`
3. **Publishable key (anon public)** → `NEXT_PUBLIC_SUPABASE_ANON_KEY=`
4. **Secret keys > service_role** → `SUPABASE_SERVICE_ROLE_KEY=`

### 3. Cloudinary 변수

1. Cloudinary Dashboard 접속
2. **Cloud name** → `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=`
3. **API Key** → `CLOUDINARY_API_KEY=`
4. **API Secret** → `CLOUDINARY_API_SECRET=`

---

## 파일 저장 후 확인

### 저장 확인

터미널에서:

```bash
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"
ls -la .env
```

출력 예시:
```
-rw-r--r--  1 user  staff  500 Jan 18 10:30 .env
```

### 내용 확인

```bash
cat .env
```

또는 특정 변수만 확인:

```bash
grep SUPABASE .env
grep CLOUDINARY .env
```

---

## 주의사항

1. **파일 이름**: 정확히 `.env` (앞에 점 포함, 확장자 없음)
2. **위치**: 프로젝트 루트 디렉토리에 있어야 함
3. **형식**: `KEY=value` (공백 없음, 따옴표 없음)
4. **보안**: 절대 GitHub에 커밋하지 마세요!

---

## 문제 해결

### .env 파일이 보이지 않나요?

터미널에서 확인:

```bash
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"
ls -la | grep .env
```

### 파일이 저장되지 않나요?

- 파일 권한 확인: `chmod 644 .env`
- 에디터에서 명시적으로 저장 (`Cmd + S`)

### 환경 변수가 로드되지 않나요?

1. `.env` 파일이 프로젝트 루트에 있는지 확인
2. 파일 이름이 정확히 `.env`인지 확인
3. 개발 서버 재시작: `npm run dev`
