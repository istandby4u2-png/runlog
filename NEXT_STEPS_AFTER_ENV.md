# .env 업데이트 후 다음 단계

## ✅ 완료된 작업
- [x] .env 파일 생성 및 환경 변수 설정

---

## 1단계: Supabase 데이터베이스 스키마 생성 확인

### 확인 방법

1. **Supabase 대시보드 접속**
   - [supabase.com](https://supabase.com) 로그인
   - 프로젝트 선택

2. **Table Editor 확인**
   - 왼쪽 사이드바 > **"Table Editor"** 클릭
   - 다음 테이블들이 있는지 확인:
     - ✅ `users`
     - ✅ `courses`
     - ✅ `running_records`
     - ✅ `likes`
     - ✅ `comments`

### 스키마가 없다면

1. **SQL Editor 열기**
   - 왼쪽 사이드바 > **"SQL Editor"** 클릭
   - **"New query"** 버튼 클릭

2. **SQL 스크립트 실행**
   - `SUPABASE_SCHEMA_SETUP.md` 파일의 SQL 스크립트 복사
   - SQL Editor에 붙여넣기
   - **"Run"** 버튼 클릭 (또는 `Cmd + Enter`)

---

## 2단계: 개발 서버 재시작

환경 변수를 변경했으므로 서버를 재시작해야 합니다.

### 서버 중지 (이미 실행 중이라면)

터미널에서 `Ctrl + C`를 눌러 서버 중지

### 서버 시작

터미널에서:

```bash
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"
npm run dev
```

### 서버 시작 확인

터미널에 다음과 같은 메시지가 표시되어야 합니다:

```
✓ Ready in X seconds
○ Local:        http://localhost:3000
```

---

## 3단계: 로컬 테스트

### 3.1 브라우저에서 접속

1. 브라우저에서 `http://localhost:3000` 접속
2. Internal Server Error가 해결되었는지 확인

### 3.2 기능 테스트

#### 테스트 1: 회원가입/로그인
1. 회원가입 페이지 접속
2. 새 계정 생성
3. 로그인 테스트

#### 테스트 2: 러닝 코스 등록
1. "Courses" 메뉴 클릭
2. "Add Course" 버튼 클릭
3. Google Maps에서 코스 그리기
4. 제목, 설명 입력
5. 이미지 업로드 (선택)
6. 저장

#### 테스트 3: 러닝 기록 업로드
1. "Record" 메뉴 클릭
2. "New Running Record" 클릭
3. 제목, 날짜 입력
4. 거리, 시간 입력
5. 날씨, 기분 선택
6. 식사 입력 → 칼로리 자동 계산 확인
7. 이미지 업로드
8. 저장

#### 테스트 4: 소셜 기능
1. 피드에서 다른 사용자의 기록 확인
2. 좋아요 버튼 클릭
3. 댓글 작성

---

## 4단계: 문제 해결

### 문제 1: 여전히 Internal Server Error

**확인 사항:**
1. 터미널 로그 확인 (오류 메시지 확인)
2. Supabase 스키마가 생성되었는지 확인
3. 환경 변수가 올바르게 설정되었는지 확인:

```bash
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"
cat .env | grep -E "^(NEXT_PUBLIC_SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY|NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME)"
```

### 문제 2: Supabase 연결 실패

**확인:**
- Supabase 대시보드 > Settings > API에서 키가 올바른지 확인
- Project URL이 올바른지 확인

### 문제 3: 이미지 업로드 실패

**확인:**
- Cloudinary Dashboard에서 API 키가 올바른지 확인
- Cloudinary 계정이 활성화되어 있는지 확인

### 문제 4: 칼로리 계산 실패

**확인:**
- Gemini API 키가 올바른지 확인
- 터미널에서 `/api/calories/test` 엔드포인트 테스트:

```bash
curl http://localhost:3000/api/calories/test
```

---

## 5단계: Vercel 배포 준비

로컬 테스트가 성공하면 Vercel에 배포할 수 있습니다.

### 5.1 Vercel 환경 변수 설정

1. **Vercel 대시보드 접속**
   - [vercel.com](https://vercel.com) 로그인
   - 프로젝트 선택

2. **환경 변수 추가**
   - 프로젝트 > **Settings** > **Environment Variables** 클릭
   - 다음 변수들을 추가 (`.env` 파일의 값과 동일):

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

**중요:**
- `NEXT_PUBLIC_`로 시작하는 변수는 Production, Preview, Development 모두에 추가
- 나머지 변수도 Production, Preview, Development 모두에 추가

### 5.2 GitHub에 코드 푸시

```bash
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"

# 변경사항 확인
git status

# 변경사항 추가
git add .

# 커밋
git commit -m "Add environment variables and migrate to Supabase/Cloudinary"

# 푸시
git push
```

### 5.3 Vercel 자동 배포

GitHub에 푸시하면 Vercel이 자동으로 배포를 시작합니다.

1. Vercel 대시보드에서 배포 상태 확인
2. 배포 완료 후 제공되는 URL로 접속
3. 프로덕션 환경에서 테스트

---

## 체크리스트

배포 전 확인사항:

- [ ] Supabase 스키마 생성 완료
- [ ] 로컬에서 모든 기능 테스트 완료
- [ ] Internal Server Error 해결 확인
- [ ] Vercel 환경 변수 설정 완료
- [ ] GitHub에 코드 푸시 완료
- [ ] Vercel 배포 완료 및 테스트 완료

---

## 다음 단계

1. ✅ Supabase 스키마 생성 확인
2. ✅ 개발 서버 재시작
3. ✅ 로컬 테스트
4. ✅ 문제 해결 (필요시)
5. ✅ Vercel 배포

문제가 발생하면 터미널 로그와 브라우저 콘솔의 오류 메시지를 확인하세요!
