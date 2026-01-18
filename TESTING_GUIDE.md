# 애플리케이션 테스트 가이드

## ✅ 현재 상태
- 로그인 페이지가 정상적으로 열림
- 개발 서버가 정상 작동 중

---

## 1단계: 회원가입 및 로그인 테스트

### 1.1 회원가입

1. `http://localhost:3006/login` 접속
2. "Register" 또는 "회원가입" 링크 클릭
3. 다음 정보 입력:
   - Username (사용자 이름)
   - Email (이메일)
   - Password (비밀번호)
4. "Register" 또는 "회원가입" 버튼 클릭
5. 성공 메시지 확인

**예상 결과:**
- 회원가입 성공 메시지 표시
- 자동으로 로그인되거나 로그인 페이지로 이동

### 1.2 로그인

1. 로그인 페이지에서:
   - Email 입력
   - Password 입력
2. "Login" 버튼 클릭

**예상 결과:**
- 로그인 성공
- 홈 페이지(피드)로 이동

---

## 2단계: 기능 테스트

### 2.1 러닝 코스 등록

1. **"Courses"** 메뉴 클릭
2. **"Add Course"** 버튼 클릭
3. Google Maps에서 코스 그리기:
   - 지도에서 경로 그리기
   - 시작점과 끝점 설정
4. 제목 입력
5. 설명 입력 (선택)
6. 이미지 업로드 (선택)
7. **"Save"** 버튼 클릭

**예상 결과:**
- 코스가 성공적으로 저장됨
- 코스 목록에 표시됨

### 2.2 러닝 기록 업로드

1. **"Record"** 메뉴 클릭
2. **"New Running Record"** 클릭
3. 다음 정보 입력:
   - **Title** (제목) - 필수
   - **Date** (날짜) - 필수
   - **Distance** (거리, km)
   - **Duration** (시간, 분)
   - **Weather** (날씨) - 이모티콘 선택
   - **Mood** (기분) - 이모티콘 선택
   - **Pre-run Meal** (식사) - 예: "500g pork belly, a plate of kimchi"
   - **Content** (내용)
   - **Photo** (사진) - 선택
4. **"Save"** 버튼 클릭

**예상 결과:**
- 기록이 성공적으로 저장됨
- 칼로리가 자동으로 계산되어 표시됨 (Gemini API)
- 이미지가 Cloudinary에 업로드됨
- 피드에 기록이 표시됨

### 2.3 칼로리 계산 테스트

1. 러닝 기록 입력 시 **"Pre-run Meal"** 필드에 식사 내용 입력
   - 예: "500g pork belly, a plate of kimchi, perilla leaves, cheongyang chili, wasabi, 300cc beer"
2. 잠시 기다리면 **Calories** 필드에 자동으로 계산된 칼로리가 표시됨

**예상 결과:**
- Gemini API가 칼로리를 계산하여 표시
- 숫자만 표시 (예: 850)

### 2.4 소셜 기능 테스트

#### 좋아요
1. 피드에서 다른 사용자의 기록 또는 코스 확인
2. **좋아요** 버튼 클릭
3. 좋아요 수가 증가하는지 확인

#### 댓글
1. 기록 또는 코스에 **댓글** 작성
2. 댓글이 표시되는지 확인

### 2.5 기록 수정 및 삭제

1. 자신이 작성한 기록에서 **"Edit"** 버튼 클릭
2. 내용 수정
3. **"Update"** 버튼 클릭
4. 수정된 내용이 반영되는지 확인

5. **"Delete"** 버튼 클릭
6. 기록이 삭제되는지 확인

### 2.6 Instagram 공유 기능

1. 기록에서 **"Instagram Share"** 버튼 클릭
2. 인스타그램 스타일 이미지가 생성되는지 확인
3. 이미지가 다운로드되는지 확인

---

## 3단계: 문제 확인

### 문제 1: 회원가입 실패

**확인 사항:**
- Supabase 스키마가 생성되었는지 확인
- 터미널 로그에서 오류 메시지 확인

**해결:**
- Supabase 대시보드 > SQL Editor에서 스키마 생성

### 문제 2: 이미지 업로드 실패

**확인 사항:**
- Cloudinary 환경 변수가 올바른지 확인
- 터미널 로그에서 Cloudinary 오류 확인

**해결:**
- `.env` 파일에서 Cloudinary 변수 확인
- Cloudinary Dashboard에서 API 키 확인

### 문제 3: 칼로리 계산 실패

**확인 사항:**
- Gemini API 키가 올바른지 확인
- 터미널 로그에서 Gemini API 오류 확인

**해결:**
- `.env` 파일에서 `GEMINI_API_KEY` 확인
- 브라우저에서 `http://localhost:3006/api/calories/test` 접속하여 API 키 상태 확인

### 문제 4: Supabase 오류

**확인 사항:**
- Supabase 스키마가 생성되었는지 확인
- Supabase 환경 변수가 올바른지 확인

**해결:**
- Supabase 대시보드 > Table Editor에서 테이블 확인
- `.env` 파일에서 Supabase 변수 확인

---

## 4단계: 완전한 테스트 체크리스트

- [ ] 회원가입 성공
- [ ] 로그인 성공
- [ ] 러닝 코스 등록 성공
- [ ] 러닝 기록 업로드 성공
- [ ] 칼로리 자동 계산 작동
- [ ] 이미지 업로드 성공 (Cloudinary)
- [ ] 좋아요 기능 작동
- [ ] 댓글 기능 작동
- [ ] 기록 수정 기능 작동
- [ ] 기록 삭제 기능 작동
- [ ] Instagram 공유 이미지 생성 작동

---

## 5단계: Vercel 배포 준비

모든 기능이 정상 작동하면 Vercel에 배포할 수 있습니다.

### 5.1 Vercel 환경 변수 설정

1. Vercel 대시보드 > 프로젝트 > Settings > Environment Variables
2. `.env` 파일의 모든 변수를 Vercel에도 추가

### 5.2 GitHub에 코드 푸시

```bash
git add .
git commit -m "Complete migration to Supabase and Cloudinary"
git push
```

### 5.3 Vercel 자동 배포

- GitHub에 푸시하면 Vercel이 자동으로 배포 시작
- 배포 완료 후 제공되는 URL로 접속하여 테스트

---

## 축하합니다! 🎉

애플리케이션이 정상적으로 작동하고 있습니다!

문제가 발생하면 터미널 로그와 브라우저 콘솔의 오류 메시지를 확인하세요.
