# Vercel 배포 오류 해결 가이드

## 오류 메시지

```
error: The provided GitHub repository does not contain the requested branch or commit reference. 
Please ensure the repository is not empty.
```

**원인:** GitHub 저장소가 비어있거나 코드가 푸시되지 않았습니다.

---

## 해결 방법

### 1단계: Git 저장소 초기화 확인

터미널에서 프로젝트 디렉토리로 이동하여 Git 상태 확인:

```bash
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"

# Git 저장소인지 확인
git status
```

**결과:**
- `fatal: not a git repository` → Git 저장소가 아닙니다 (2단계로 이동)
- Git 상태가 표시됨 → Git 저장소입니다 (3단계로 이동)

---

### 2단계: Git 저장소 초기화 (필요한 경우)

Git 저장소가 아니라면 초기화:

```bash
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"

# Git 저장소 초기화
git init

# .gitignore 확인 (이미 있어야 함)
ls -la .gitignore
```

---

### 3단계: GitHub 저장소 확인

#### 3.1 GitHub 저장소가 이미 연결되어 있는지 확인

```bash
# 원격 저장소 확인
git remote -v
```

**결과:**
- 원격 저장소가 표시됨 → 4단계로 이동
- `fatal: No remote configured` → GitHub 저장소 생성 필요 (3.2로 이동)

#### 3.2 GitHub 저장소 생성 (필요한 경우)

1. **GitHub 웹사이트 접속**
   - [github.com](https://github.com) 로그인

2. **새 저장소 생성**
   - 우측 상단 "+" 버튼 클릭
   - "New repository" 선택
   - Repository name: `runlog` (또는 원하는 이름)
   - Public 또는 Private 선택
   - **"Initialize this repository with a README" 체크 해제** (이미 코드가 있으므로)
   - "Create repository" 클릭

3. **저장소 URL 복사**
   - 생성된 저장소 페이지에서 URL 복사
   - 예: `https://github.com/yourusername/runlog.git`

---

### 4단계: 코드 커밋 및 푸시

#### 4.1 변경사항 추가

```bash
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"

# 모든 변경사항 추가
git add .

# 커밋
git commit -m "Initial commit: RunLog application with Supabase and Cloudinary"
```

#### 4.2 원격 저장소 연결 (아직 연결되지 않은 경우)

```bash
# 원격 저장소 추가 (GitHub에서 복사한 URL 사용)
git remote add origin https://github.com/yourusername/runlog.git

# 원격 저장소 확인
git remote -v
```

#### 4.3 GitHub에 푸시

```bash
# 메인 브랜치로 푸시
git branch -M main
git push -u origin main
```

**참고:** 
- GitHub 인증이 필요할 수 있습니다
- Personal Access Token 또는 SSH 키가 필요할 수 있습니다

---

### 5단계: Vercel에서 다시 배포

#### 5.1 Vercel 대시보드에서

1. **프로젝트 삭제** (필요한 경우)
   - 기존 프로젝트가 있다면 삭제

2. **새 프로젝트 생성**
   - "Add New..." > "Project" 클릭
   - GitHub 저장소 선택
   - Import 클릭

3. **프로젝트 설정**
   - Framework Preset: Next.js (자동 감지)
   - Root Directory: `./` (기본값)
   - Build Command: `npm run build` (기본값)
   - Output Directory: `.next` (기본값)

4. **환경 변수 설정**
   - "Environment Variables" 섹션에서 다음 변수 추가:

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

   - 각 변수에 `.env` 파일의 값 입력
   - Production, Preview, Development 모두에 추가

5. **Deploy 클릭**

---

## 문제 해결

### 문제 1: Git push 실패 - 인증 오류

**해결:**
1. GitHub Personal Access Token 생성:
   - GitHub > Settings > Developer settings > Personal access tokens > Tokens (classic)
   - "Generate new token" 클릭
   - `repo` 권한 선택
   - 토큰 생성 및 복사

2. 푸시 시 토큰 사용:
   ```bash
   git push -u origin main
   # Username: GitHub 사용자명
   # Password: Personal Access Token (비밀번호 아님!)
   ```

### 문제 2: Git push 실패 - 브랜치 이름 오류

**해결:**
```bash
# 브랜치 이름 확인
git branch

# 메인 브랜치로 변경
git branch -M main
git push -u origin main
```

### 문제 3: Vercel에서 저장소를 찾을 수 없음

**해결:**
1. Vercel 대시보드에서 GitHub 연결 확인
2. Vercel > Settings > Git > GitHub 연결 확인
3. 저장소 권한 확인

---

## 빠른 체크리스트

- [ ] Git 저장소 초기화 완료
- [ ] GitHub 저장소 생성 완료
- [ ] 원격 저장소 연결 완료
- [ ] 코드 커밋 완료
- [ ] GitHub에 푸시 완료
- [ ] Vercel에서 저장소 선택 가능
- [ ] Vercel 환경 변수 설정 완료
- [ ] 배포 성공

---

## 다음 단계

배포가 성공하면:

1. ✅ Vercel에서 제공하는 URL로 접속
2. ✅ 프로덕션 환경에서 테스트
3. ✅ 모든 기능이 정상 작동하는지 확인

문제가 계속되면 Git 상태와 오류 메시지를 알려주세요!
