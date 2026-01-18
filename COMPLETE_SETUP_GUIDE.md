# RunLog 클라우드 배포 완전 가이드

## 현재까지 완료된 작업 ✅
- ✅ Vercel 저장소 연결
- ✅ Supabase 프로젝트 생성

---

## 1단계: Supabase 데이터베이스 스키마 생성

### 1.1 Supabase 대시보드 접속
1. [supabase.com](https://supabase.com) 접속
2. 로그인 후 프로젝트 선택

### 1.2 SQL Editor에서 스키마 생성
1. 왼쪽 사이드바에서 **"SQL Editor"** 클릭
2. **"New query"** 버튼 클릭
3. 아래 SQL 스크립트를 **전체 복사**하여 붙여넣기:

```sql
-- Users 테이블
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Courses 테이블
CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  path_data TEXT NOT NULL,
  image_url TEXT,
  distance REAL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Running Records 테이블
CREATE TABLE IF NOT EXISTS running_records (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  image_url TEXT,
  distance REAL,
  duration INTEGER,
  record_date DATE NOT NULL,
  weather TEXT,
  mood TEXT,
  meal TEXT,
  calories INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Likes 테이블
CREATE TABLE IF NOT EXISTS likes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  record_id INTEGER REFERENCES running_records(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, course_id),
  UNIQUE(user_id, record_id)
);

-- Comments 테이블
CREATE TABLE IF NOT EXISTS comments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  record_id INTEGER REFERENCES running_records(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_courses_user_id ON courses(user_id);
CREATE INDEX IF NOT EXISTS idx_running_records_user_id ON running_records(user_id);
CREATE INDEX IF NOT EXISTS idx_running_records_course_id ON running_records(course_id);
CREATE INDEX IF NOT EXISTS idx_likes_course_id ON likes(course_id);
CREATE INDEX IF NOT EXISTS idx_likes_record_id ON likes(record_id);
CREATE INDEX IF NOT EXISTS idx_comments_course_id ON comments(course_id);
CREATE INDEX IF NOT EXISTS idx_comments_record_id ON comments(record_id);
```

4. 하단의 **"Run"** 버튼 클릭 (또는 `Cmd + Enter` / `Ctrl + Enter`)
5. **"Success. No rows returned"** 메시지 확인

### 1.3 테이블 생성 확인
1. 왼쪽 사이드바에서 **"Table Editor"** 클릭
2. 다음 테이블들이 보이는지 확인:
   - ✅ `users`
   - ✅ `courses`
   - ✅ `running_records`
   - ✅ `likes`
   - ✅ `comments`

### 1.4 Supabase 연결 정보 복사
1. Supabase 대시보드 > **Settings** > **API** 클릭
2. 다음 정보를 복사해두세요 (나중에 사용):
   - **Project URL** (예: `https://xxxxx.supabase.co`)
   - **anon public** key
   - **service_role** key (비밀! 서버 사이드에서만 사용)

---

## 2단계: Cloudinary 계정 생성 및 설정

### 2.1 Cloudinary 계정 생성
1. [cloudinary.com](https://cloudinary.com) 접속
2. **"Sign Up for Free"** 클릭
3. 이메일로 가입 (무료 플랜)
4. 이메일 인증 완료

### 2.2 Cloudinary 정보 확인
1. Cloudinary Dashboard 접속
2. 다음 정보를 복사해두세요:
   - **Cloud name** (예: `dxxxxx`)
   - **API Key**
   - **API Secret**

---

## 3단계: 환경 변수 설정

### 3.1 로컬 개발 환경 (.env 파일)

프로젝트 루트 디렉토리에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
# Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key

# JWT Secret (임의의 긴 문자열)
JWT_SECRET=your_secure_random_string_here_minimum_32_characters

# Gemini API
GEMINI_API_KEY=your_gemini_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**중요**: 
- `your_google_maps_key`, `your_gemini_key` 등은 실제 값으로 교체하세요
- `JWT_SECRET`은 최소 32자 이상의 임의의 문자열을 사용하세요
- Supabase와 Cloudinary 정보는 위에서 복사한 값을 사용하세요

### 3.2 .env 파일 생성 방법

터미널에서:

```bash
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"
nano .env
```

또는 텍스트 에디터로 `.env` 파일을 생성하세요.

---

## 4단계: 패키지 설치

터미널에서:

```bash
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"
npm install
```

---

## 5단계: 로컬에서 테스트

### 5.1 개발 서버 시작

```bash
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"
npm run dev
```

### 5.2 브라우저에서 확인

1. 브라우저에서 `http://localhost:3000` 접속
2. 회원가입/로그인 테스트
3. 러닝 코스 등록 테스트
4. 러닝 기록 업로드 테스트 (이미지 포함)
5. 좋아요/댓글 기능 테스트

### 5.3 문제 해결

- **연결 오류**: `.env` 파일의 환경 변수가 올바른지 확인
- **이미지 업로드 실패**: Cloudinary 설정 확인
- **데이터베이스 오류**: Supabase 스키마가 올바르게 생성되었는지 확인

---

## 6단계: Vercel 배포

### 6.1 Vercel 프로젝트 설정

1. [vercel.com](https://vercel.com) 접속
2. 프로젝트 선택 (또는 새 프로젝트 생성)
3. GitHub 저장소 연결 확인

### 6.2 Vercel 환경 변수 설정

Vercel 대시보드 > 프로젝트 > **Settings** > **Environment Variables**에서 다음 변수들을 추가:

```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
JWT_SECRET
GEMINI_API_KEY
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

**중요**: 
- `.env` 파일의 값과 동일하게 설정
- `NEXT_PUBLIC_`로 시작하는 변수는 클라이언트에서도 사용 가능
- `SUPABASE_SERVICE_ROLE_KEY`와 `CLOUDINARY_API_SECRET`은 **절대 공개하지 마세요**

### 6.3 배포 실행

1. Vercel 대시보드에서 **"Deploy"** 클릭
2. 또는 GitHub에 코드를 푸시하면 자동 배포됩니다:

```bash
git add .
git commit -m "Migrate to Supabase and Cloudinary"
git push
```

### 6.4 배포 확인

1. Vercel 대시보드에서 배포 상태 확인
2. 배포 완료 후 제공되는 URL로 접속
3. 모든 기능이 정상 작동하는지 테스트

---

## 체크리스트

배포 전 확인사항:

- [ ] Supabase 데이터베이스 스키마 생성 완료
- [ ] Supabase 연결 정보 복사 완료
- [ ] Cloudinary 계정 생성 및 정보 복사 완료
- [ ] 로컬 `.env` 파일 생성 및 모든 환경 변수 설정 완료
- [ ] 로컬에서 `npm run dev` 실행하여 테스트 완료
- [ ] Vercel 환경 변수 설정 완료
- [ ] GitHub에 코드 푸시 완료
- [ ] Vercel 배포 완료 및 테스트 완료

---

## 문제 해결

### Supabase 연결 실패
- Project URL과 API 키가 올바른지 확인
- 데이터베이스 스키마가 생성되었는지 확인
- `.env` 파일의 변수명이 정확한지 확인

### Cloudinary 업로드 실패
- Cloud name, API Key, API Secret이 올바른지 확인
- Cloudinary 대시보드에서 업로드 권한 확인

### Vercel 배포 실패
- 환경 변수가 모두 설정되었는지 확인
- 빌드 로그에서 오류 메시지 확인
- `package.json`의 스크립트가 올바른지 확인

---

## 다음 단계

모든 단계를 완료했다면:
1. ✅ 프로덕션 환경에서 테스트
2. ✅ 도메인 연결 (선택사항)
3. ✅ 모니터링 설정 (선택사항)

문제가 발생하면 각 단계의 로그를 확인하거나 질문해주세요!
