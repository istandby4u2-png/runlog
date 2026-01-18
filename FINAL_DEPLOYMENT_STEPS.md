# 최종 배포 단계

## ✅ 완료된 작업

- [x] 로컬 빌드 성공
- [x] 모든 TypeScript 타입 오류 수정 완료

---

## 다음 단계: GitHub 푸시 및 Vercel 재배포

### 1단계: 변경사항 커밋 및 푸시

터미널에서 다음 명령을 실행하세요:

```bash
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"

# 변경사항 확인
git status

# 모든 변경사항 추가
git add .

# 커밋
git commit -m "Fix TypeScript type errors for production build

- Fix uploadImage folder parameter type
- Fix CommentSection recordId optional type
- Fix InstagramShare image_url type guard"

# GitHub에 푸시
git push origin main
```

---

### 2단계: Vercel 자동 재배포 확인

GitHub에 푸시하면 Vercel이 자동으로 재배포를 시작합니다:

1. **Vercel 대시보드 접속**
   - [vercel.com](https://vercel.com) 로그인
   - 프로젝트 선택

2. **새 배포 확인**
   - "Deployments" 탭에서 새 배포가 시작되는지 확인
   - 빌드 로그 확인

3. **배포 완료 대기**
   - "Ready" 상태가 될 때까지 대기 (약 2-5분)
   - 배포 URL 확인

---

### 3단계: 프로덕션 환경 테스트

배포가 완료되면:

1. **프로덕션 URL 접속**
   - Vercel에서 제공하는 URL 접속
   - 예: `https://runlog.vercel.app`

2. **기능 테스트**
   - [ ] 홈페이지 로드 확인
   - [ ] 회원가입 테스트
   - [ ] 로그인 테스트
   - [ ] 러닝 코스 등록 테스트
   - [ ] 러닝 기록 업로드 테스트
   - [ ] 이미지 업로드 테스트 (Cloudinary)
   - [ ] 칼로리 계산 테스트 (Gemini API)
   - [ ] 좋아요/댓글 기능 테스트
   - [ ] Instagram 공유 기능 테스트

---

## 중요 확인사항

### Supabase 스키마

프로덕션 환경에서도 Supabase 스키마가 필요합니다:

1. **Supabase 대시보드 확인**
   - Table Editor에서 다음 테이블 확인:
     - `users`
     - `courses`
     - `running_records`
     - `likes`
     - `comments`

2. **테이블이 없다면**
   - SQL Editor에서 `SUPABASE_SCHEMA_SETUP.md` 파일의 SQL 스크립트 실행

---

## 문제 해결

### 배포가 실패한다면

1. **빌드 로그 확인**
   - Vercel 대시보드에서 빌드 로그 확인
   - 오류 메시지 확인

2. **환경 변수 확인**
   - 모든 환경 변수가 추가되었는지 확인
   - Production, Preview, Development 모두에 추가되었는지 확인

### 프로덕션에서 오류 발생

1. **브라우저 콘솔 확인**
   - `F12` 또는 `Cmd + Option + I`
   - Console 탭에서 오류 확인

2. **Vercel 함수 로그 확인**
   - Vercel 대시보드 > 프로젝트 > Functions
   - 함수 로그 확인

---

## 체크리스트

배포 전:
- [x] 로컬 빌드 성공
- [ ] 변경사항 커밋 및 푸시
- [ ] Vercel 자동 재배포 확인
- [ ] 배포 완료 확인

배포 후:
- [ ] 프로덕션 URL 접속 확인
- [ ] Supabase 스키마 생성 확인
- [ ] 모든 기능 테스트 완료

---

## 축하합니다! 🎉

모든 타입 오류가 수정되었고 로컬 빌드가 성공했습니다!

이제 GitHub에 푸시하면 Vercel이 자동으로 재배포합니다.

배포가 완료되면 프로덕션 환경에서 테스트하세요!
