# GitHub에 코드 푸시하기

## 현재 상황

- ✅ GitHub 저장소 존재: `https://github.com/istandby4u2-png/runlog`
- ⚠️ 저장소가 비어있음 (코드가 푸시되지 않음)
- ⚠️ 원격 저장소 URL이 예시로 설정되어 있음

---

## 해결 방법

### 1단계: 원격 저장소 URL 업데이트

터미널에서 다음 명령 실행:

```bash
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"

# 원격 저장소 URL을 실제 GitHub 저장소로 변경
git remote set-url origin https://github.com/istandby4u2-png/runlog.git

# 확인
git remote -v
```

**확인 결과:**
```
origin  https://github.com/istandby4u2-png/runlog.git (fetch)
origin  https://github.com/istandby4u2-png/runlog.git (push)
```

### 2단계: 변경사항 커밋

```bash
# 모든 변경사항 추가
git add .

# 커밋
git commit -m "Complete migration to Supabase and Cloudinary

- Migrate database from SQLite to Supabase
- Migrate file uploads to Cloudinary
- Update all API routes
- Add environment variables configuration"
```

### 3단계: GitHub에 푸시

```bash
# 메인 브랜치로 푸시
git push -u origin main
```

**참고:** 
- GitHub 인증이 필요할 수 있습니다
- Personal Access Token 또는 SSH 키가 필요할 수 있습니다

---

## 인증 문제 해결

### Personal Access Token 사용

Git push 시 인증 오류가 발생하면:

1. **GitHub Personal Access Token 생성:**
   - GitHub > Settings > Developer settings > Personal access tokens > Tokens (classic)
   - "Generate new token (classic)" 클릭
   - Note: `Vercel Deployment` (설명)
   - Expiration: 원하는 기간 선택
   - Scopes: `repo` 체크
   - "Generate token" 클릭
   - **토큰을 복사해두세요** (다시 볼 수 없습니다!)

2. **푸시 시 토큰 사용:**
   ```bash
   git push -u origin main
   ```
   - Username: `istandby4u2-png`
   - Password: **Personal Access Token** (비밀번호가 아님!)

---

## 푸시 확인

푸시가 성공하면:

1. **GitHub 저장소 확인:**
   - [https://github.com/istandby4u2-png/runlog](https://github.com/istandby4u2-png/runlog) 접속
   - 파일들이 표시되는지 확인

2. **브랜치 확인:**
   - `main` 브랜치에 코드가 있는지 확인

---

## Vercel 배포

코드가 GitHub에 푸시되면:

1. **Vercel 대시보드 접속**
2. **"Add New..." > "Project"** 클릭
3. **GitHub 저장소 선택:**
   - `istandby4u2-png/runlog` 선택
   - Import 클릭

4. **프로젝트 설정:**
   - Framework Preset: Next.js (자동 감지)
   - Root Directory: `./` (기본값)
   - Build Command: `npm run build` (기본값)
   - Output Directory: `.next` (기본값)

5. **환경 변수 설정:**
   - "Environment Variables" 섹션에서 다음 변수 추가:

```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyCY6pkLokXVXdDEg78KRofqNdG2qWODve8
JWT_SECRET=Tybzsd198Z9AAJ9D7fPMt7c7e9dwaZWUtsUCM5GrWuI=
GEMINI_API_KEY=AIzaSyCz-ZPlMtzFjkXvGuV0HP22sWupJp7uL_4
NEXT_PUBLIC_SUPABASE_URL=https://heytensiqyzqscptkcym.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_7rARXtWTwlJunQ1VfEAZ3w_yWRkVz1X
SUPABASE_SERVICE_ROLE_KEY=sb_secret_1NPYzgAMyWC8IvXNRUH0Kw_HBx4bDEd
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dwcx3cxxd
CLOUDINARY_API_KEY=889538896366331
CLOUDINARY_API_SECRET=cxGoHkFn5FdUxwFzNqGY8qAaTMI
```

   - 각 변수에 `.env` 파일의 값 입력
   - **Production, Preview, Development 모두에 추가**

6. **Deploy 클릭**

---

## 문제 해결

### 문제 1: "remote origin already exists"

**해결:**
```bash
# 기존 원격 저장소 제거
git remote remove origin

# 새로 추가
git remote add origin https://github.com/istandby4u2-png/runlog.git
```

### 문제 2: "Authentication failed"

**해결:**
- Personal Access Token 사용
- 또는 SSH 키 설정

### 문제 3: "Updates were rejected"

**해결:**
```bash
# 강제 푸시 (주의: 저장소가 비어있을 때만 사용)
git push -u origin main --force
```

---

## 체크리스트

- [ ] 원격 저장소 URL 업데이트 완료
- [ ] 변경사항 커밋 완료
- [ ] GitHub에 푸시 완료
- [ ] GitHub 저장소에서 파일 확인 완료
- [ ] Vercel에서 저장소 선택 가능
- [ ] Vercel 환경 변수 설정 완료
- [ ] 배포 성공

---

## 다음 단계

배포가 성공하면:

1. ✅ Vercel에서 제공하는 URL로 접속
2. ✅ 프로덕션 환경에서 테스트
3. ✅ 모든 기능이 정상 작동하는지 확인

문제가 발생하면 알려주세요!
