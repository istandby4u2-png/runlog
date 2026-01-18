# Supabase 데이터베이스 스키마 생성 가이드

## 단계별 가이드

### 1단계: Supabase 대시보드 접속

1. [supabase.com](https://supabase.com) 접속
2. 로그인
3. 프로젝트 선택 (또는 새 프로젝트 생성)

### 2단계: SQL Editor 열기

1. 왼쪽 사이드바에서 **"SQL Editor"** 클릭
   - 또는 상단 메뉴에서 **"SQL Editor"** 선택
2. **"New query"** 버튼 클릭
   - 또는 기존 쿼리 탭이 있으면 그곳에 입력

### 3단계: SQL 스크립트 복사 및 실행

#### 3.1 전체 SQL 스크립트

다음 SQL 스크립트를 **전체 복사**하세요:

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

#### 3.2 SQL 실행 방법

1. **SQL Editor**에서 위 스크립트를 붙여넣기
2. 하단의 **"Run"** 버튼 클릭
   - 또는 키보드 단축키: `Ctrl + Enter` (Windows/Linux) 또는 `Cmd + Enter` (Mac)
3. 실행 결과 확인:
   - 성공: "Success. No rows returned" 메시지 표시
   - 실패: 에러 메시지 표시 (확인 필요)

### 4단계: 테이블 생성 확인

#### 4.1 Table Editor에서 확인

1. 왼쪽 사이드바에서 **"Table Editor"** 클릭
2. 다음 테이블들이 생성되었는지 확인:
   - ✅ `users`
   - ✅ `courses`
   - ✅ `running_records`
   - ✅ `likes`
   - ✅ `comments`

#### 4.2 SQL로 확인

SQL Editor에서 다음 쿼리 실행:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

다음 테이블이 표시되어야 합니다:
- comments
- courses
- likes
- running_records
- users

---

## 문제 해결

### 문제 1: "relation already exists" 에러

**원인**: 테이블이 이미 존재함

**해결**: 
- `CREATE TABLE IF NOT EXISTS`를 사용했으므로 무시해도 됩니다
- 또는 기존 테이블을 삭제하고 다시 실행:
  ```sql
  DROP TABLE IF EXISTS comments;
  DROP TABLE IF EXISTS likes;
  DROP TABLE IF EXISTS running_records;
  DROP TABLE IF EXISTS courses;
  DROP TABLE IF EXISTS users;
  ```
  그 다음 위의 CREATE TABLE 스크립트 다시 실행

### 문제 2: "permission denied" 에러

**원인**: 권한 문제

**해결**: 
- Supabase 프로젝트 소유자인지 확인
- SQL Editor에서 실행 중인지 확인 (다른 도구가 아님)

### 문제 3: "syntax error" 에러

**원인**: SQL 문법 오류

**해결**: 
- SQL 스크립트를 다시 복사하여 붙여넣기
- 따옴표나 세미콜론 확인
- 한 줄씩 실행하여 어느 부분에서 오류가 나는지 확인

---

## 테이블 구조 설명

### users 테이블
- 사용자 정보 저장
- `id`: 자동 증가 기본 키
- `username`, `email`: 고유값 (UNIQUE)

### courses 테이블
- 러닝 코스 정보 저장
- `user_id`: 코스를 만든 사용자 (외래 키)
- `path_data`: 지도 경로 데이터 (JSON 문자열)

### running_records 테이블
- 러닝 기록 저장
- `user_id`: 기록을 작성한 사용자
- `course_id`: 사용한 코스 (선택사항)
- `weather`, `mood`: 이모티콘
- `meal`, `calories`: 식사 정보

### likes 테이블
- 좋아요 정보 저장
- `user_id`와 `course_id` 또는 `record_id` 조합이 고유 (UNIQUE)

### comments 테이블
- 댓글 정보 저장
- 코스 또는 기록에 댓글 작성 가능

---

## 다음 단계

스키마 생성이 완료되면:

1. ✅ 테이블 생성 확인
2. ✅ 환경 변수 설정 (Supabase URL, API 키)
3. ✅ 코드 마이그레이션 진행

테이블이 정상적으로 생성되었는지 확인해주세요!
