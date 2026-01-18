# 클라우드 배포 설정 단계별 가이드

## 1단계: Supabase 설정 (데이터베이스)

### 1.1 Supabase 프로젝트 생성
1. [supabase.com](https://supabase.com) 접속
2. "Start your project" 클릭
3. GitHub 계정으로 로그인
4. "New Project" 클릭
5. 프로젝트 정보 입력:
   - **Name**: `runlog`
   - **Database Password**: 강력한 비밀번호 설정 (기억해두세요!)
   - **Region**: 가장 가까운 리전 선택 (예: Northeast Asia (Seoul))
6. "Create new project" 클릭 (약 2분 소요)

### 1.2 데이터베이스 스키마 생성

**자세한 가이드**: [SUPABASE_SCHEMA_SETUP.md](./SUPABASE_SCHEMA_SETUP.md) 참고

**간단한 방법**:
1. Supabase 대시보드 > 왼쪽 사이드바에서 **"SQL Editor"** 클릭
2. **"New query"** 버튼 클릭
3. 아래 SQL 스크립트를 복사하여 붙여넣기
4. 하단의 **"Run"** 버튼 클릭 (또는 `Cmd + Enter` / `Ctrl + Enter`)

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

### 1.3 Supabase 연결 정보 확인
1. Supabase 대시보드 > **Settings** > **API**
2. 다음 정보 복사:
   - **Project URL** (예: `https://xxxxx.supabase.co`)
   - **anon public** key
   - **service_role** key (비밀! 서버 사이드에서만 사용)

---

## 2단계: Cloudinary 설정 (파일 저장소)

### 2.1 Cloudinary 계정 생성
1. [cloudinary.com](https://cloudinary.com) 접속
2. "Sign Up for Free" 클릭
3. 이메일로 가입 (무료 플랜)
4. 이메일 인증 완료

### 2.2 Cloudinary 정보 확인
1. Cloudinary Dashboard 접속
2. 다음 정보 확인:
   - **Cloud name** (예: `dxxxxx`)
   - **API Key**
   - **API Secret**

---

## 3단계: 환경 변수 설정

`.env` 파일에 다음을 추가하세요:

```env
# 기존 환경 변수
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
JWT_SECRET=your_secure_random_string_here
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

---

## 4단계: 패키지 설치

터미널에서:

```bash
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"
npm install
```

---

## 5단계: 코드 마이그레이션

이제 코드를 Supabase와 Cloudinary로 마이그레이션해야 합니다.

**다음 단계:**
1. Supabase와 Cloudinary 계정 생성 완료
2. 환경 변수 설정 완료
3. 패키지 설치 완료

위 단계를 완료하셨다면 알려주세요. 코드 마이그레이션을 진행하겠습니다!

---

## 참고: Supabase 무료 플랜

- **데이터베이스**: 500MB
- **API 요청**: 무제한
- **파일 저장소**: 1GB (별도 Storage 사용)
- **대역폭**: 5GB/월

## 참고: Cloudinary 무료 플랜

- **저장 공간**: 25GB
- **대역폭**: 25GB/월
- **변환**: 25,000 credits/월

---

## 문제 해결

### Supabase 연결 실패
- Project URL과 API 키가 올바른지 확인
- 데이터베이스 스키마가 생성되었는지 확인

### Cloudinary 업로드 실패
- Cloud name, API Key, API Secret이 올바른지 확인
- API Secret은 서버 사이드에서만 사용 (클라이언트에 노출 금지)
