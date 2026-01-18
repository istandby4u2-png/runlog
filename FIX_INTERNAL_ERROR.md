# Internal Server Error 해결 방법

## 가장 가능성 높은 원인

### 원인 1: Supabase 스키마 미생성 (90% 확률)

**증상:** 
- Internal Server Error 발생
- 터미널에 `relation "users" does not exist` 오류

**해결:**
1. Supabase 대시보드 > SQL Editor
2. `SUPABASE_SCHEMA_SETUP.md` 파일의 SQL 스크립트 실행
3. Table Editor에서 테이블 생성 확인

### 원인 2: Supabase 연결 실패

**증상:**
- 터미널에 `Supabase 관리자 클라이언트가 초기화되지 않았습니다` 오류

**해결:**
1. `.env` 파일에서 `SUPABASE_SERVICE_ROLE_KEY` 확인
2. Supabase 대시보드 > Settings > API > Secret keys > service_role 복사
3. 서버 재시작

---

## 즉시 확인할 사항

### 1. 터미널 로그 확인

개발 서버를 실행한 터미널에서 오류 메시지를 확인하세요.

**찾아야 할 메시지:**
- `❌ Supabase 관리자 클라이언트가 초기화되지 않았습니다`
- `relation "users" does not exist`
- `Cannot read property 'from' of null`

### 2. Supabase 스키마 확인

1. Supabase 대시보드 접속
2. Table Editor에서 다음 테이블 확인:
   - `users`
   - `courses`
   - `running_records`
   - `likes`
   - `comments`

**테이블이 없다면:** SQL Editor에서 스키마 생성 필요

---

## 단계별 해결

### Step 1: Supabase 스키마 생성

1. **Supabase 대시보드 > SQL Editor**
2. **New query** 클릭
3. 아래 SQL 스크립트 복사하여 실행:

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

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_courses_user_id ON courses(user_id);
CREATE INDEX IF NOT EXISTS idx_running_records_user_id ON running_records(user_id);
CREATE INDEX IF NOT EXISTS idx_running_records_course_id ON running_records(course_id);
CREATE INDEX IF NOT EXISTS idx_likes_course_id ON likes(course_id);
CREATE INDEX IF NOT EXISTS idx_likes_record_id ON likes(record_id);
CREATE INDEX IF NOT EXISTS idx_comments_course_id ON comments(course_id);
CREATE INDEX IF NOT EXISTS idx_comments_record_id ON comments(record_id);
```

4. **Run** 버튼 클릭
5. **Success** 메시지 확인

### Step 2: 서버 재시작

```bash
# 서버 중지 (Ctrl + C)
# 재시작
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"
npm run dev
```

### Step 3: 테스트

브라우저에서 `http://localhost:3000` 접속하여 오류가 해결되었는지 확인

---

## 추가 확인 사항

### 환경 변수 확인

터미널에서:

```bash
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"

# .env 파일 존재 확인
ls -la .env

# 환경 변수 이름 확인 (값은 보이지 않음)
grep -E "^[A-Z_]+=" .env | cut -d= -f1
```

다음 변수들이 모두 있어야 합니다:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `JWT_SECRET`

---

## 문제가 계속되면

다음 정보를 제공해주세요:

1. **터미널의 전체 오류 메시지** (스크린샷 또는 복사)
2. **어떤 페이지에서 오류 발생** (로그인, 홈, 기록 등록 등)
3. **Supabase 스키마 생성 여부** (Table Editor에서 확인)
