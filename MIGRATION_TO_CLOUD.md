# 클라우드 배포 마이그레이션 가이드

## 목표
SQLite → Supabase (PostgreSQL)
로컬 파일 저장소 → Cloudinary

## 1단계: Supabase 설정

### 1.1 Supabase 프로젝트 생성
1. [supabase.com](https://supabase.com) 접속
2. "Start your project" 클릭
3. GitHub 계정으로 로그인
4. 새 프로젝트 생성
   - 프로젝트 이름: `runlog`
   - 데이터베이스 비밀번호 설정 (기억해두세요!)
   - 리전 선택 (가장 가까운 리전)

### 1.2 데이터베이스 스키마 생성

Supabase 대시보드 > SQL Editor에서 다음 SQL 실행:

```sql
-- Users 테이블
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Courses 테이블
CREATE TABLE courses (
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
CREATE TABLE running_records (
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
CREATE TABLE likes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  record_id INTEGER REFERENCES running_records(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, course_id),
  UNIQUE(user_id, record_id)
);

-- Comments 테이블
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
  record_id INTEGER REFERENCES running_records(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX idx_courses_user_id ON courses(user_id);
CREATE INDEX idx_running_records_user_id ON running_records(user_id);
CREATE INDEX idx_running_records_course_id ON running_records(course_id);
CREATE INDEX idx_likes_course_id ON likes(course_id);
CREATE INDEX idx_likes_record_id ON likes(record_id);
CREATE INDEX idx_comments_course_id ON comments(course_id);
CREATE INDEX idx_comments_record_id ON comments(record_id);
```

### 1.3 Supabase 연결 정보 확인
- Supabase 대시보드 > Settings > API
- 다음 정보 확인:
  - Project URL
  - anon public key
  - service_role key (비밀!)

---

## 2단계: Cloudinary 설정

### 2.1 Cloudinary 계정 생성
1. [cloudinary.com](https://cloudinary.com) 접속
2. 무료 계정 생성
3. Dashboard에서 다음 정보 확인:
   - Cloud name
   - API Key
   - API Secret

---

## 3단계: 코드 마이그레이션

### 3.1 패키지 설치

```bash
npm install @supabase/supabase-js cloudinary next-cloudinary
```

### 3.2 환경 변수 추가

`.env` 파일에 추가:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3.3 Supabase 클라이언트 설정

`lib/supabase.ts` 파일 생성 필요

### 3.4 Cloudinary 설정

`lib/cloudinary.ts` 파일 생성 필요

### 3.5 데이터베이스 코드 수정

`lib/db.ts`를 Supabase 클라이언트로 변경

### 3.6 파일 업로드 코드 수정

이미지 업로드 부분을 Cloudinary로 변경

---

## 4단계: Vercel 배포

### 4.1 GitHub에 코드 푸시

```bash
git init
git add .
git commit -m "Prepare for cloud deployment"
git remote add origin https://github.com/yourusername/runlog.git
git push -u origin main
```

### 4.2 Vercel 배포

1. [vercel.com](https://vercel.com) 접속
2. GitHub 계정으로 로그인
3. "New Project" 클릭
4. GitHub 저장소 선택
5. 환경 변수 설정:
   ```
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
   JWT_SECRET=...
   GEMINI_API_KEY=...
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=...
   CLOUDINARY_API_KEY=...
   CLOUDINARY_API_SECRET=...
   ```
6. "Deploy" 클릭

---

## 마이그레이션 체크리스트

- [ ] Supabase 프로젝트 생성
- [ ] 데이터베이스 스키마 생성
- [ ] Cloudinary 계정 생성
- [ ] 패키지 설치
- [ ] 환경 변수 설정
- [ ] 코드 마이그레이션
- [ ] 로컬 테스트
- [ ] GitHub에 푸시
- [ ] Vercel 배포
- [ ] 프로덕션 테스트

---

## 다음 단계

이제 실제 코드 마이그레이션을 진행하겠습니다. 계속 진행할까요?
