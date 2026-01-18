# GitHub Personal Access Token 생성 및 사용 가이드

## 문제

```
remote: Invalid username or token. Password authentication is not supported for Git operations.
```

**원인:** GitHub는 2021년부터 비밀번호 인증을 지원하지 않습니다. Personal Access Token을 사용해야 합니다.

---

## 해결 방법

### 1단계: GitHub Personal Access Token 생성

1. **GitHub 웹사이트 접속**
   - [github.com](https://github.com) 로그인

2. **Settings로 이동**
   - 우측 상단 프로필 사진 클릭
   - "Settings" 클릭

3. **Developer settings로 이동**
   - 왼쪽 사이드바 하단 "Developer settings" 클릭

4. **Personal access tokens 생성**
   - "Personal access tokens" > "Tokens (classic)" 클릭
   - "Generate new token" > "Generate new token (classic)" 클릭

5. **토큰 설정**
   - **Note**: `Vercel Deployment` 또는 원하는 설명 입력
   - **Expiration**: 원하는 기간 선택 (예: 90 days, 1 year)
   - **Scopes**: 다음 권한 체크:
     - ✅ `repo` (전체 저장소 권한)
       - ✅ `repo:status`
       - ✅ `repo_deployment`
       - ✅ `public_repo`
       - ✅ `repo:invite`
       - ✅ `security_events`

6. **토큰 생성**
   - 하단 "Generate token" 버튼 클릭
   - **⚠️ 중요: 토큰을 즉시 복사하세요!** (다시 볼 수 없습니다)
   - 예: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

### 2단계: Personal Access Token 사용

#### 방법 1: 푸시 시 직접 입력 (추천)

터미널에서:

```bash
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"

git push -u origin main
```

프롬프트가 나타나면:
- **Username**: `istandby4u2-png`
- **Password**: **Personal Access Token** (비밀번호가 아님!)

#### 방법 2: Git Credential Helper 사용 (자동 저장)

터미널에서:

```bash
# Git credential helper 설정 (macOS)
git config --global credential.helper osxkeychain

# 푸시 시도
git push -u origin main
```

- Username: `istandby4u2-png`
- Password: Personal Access Token 입력
- macOS Keychain에 자동 저장됨 (다음부터 자동 인증)

#### 방법 3: URL에 토큰 포함 (임시)

```bash
# 원격 저장소 URL에 토큰 포함
git remote set-url origin https://istandby4u2-png:YOUR_TOKEN@github.com/istandby4u2-png/runlog.git

# 푸시
git push -u origin main
```

**⚠️ 주의:** 이 방법은 보안상 권장하지 않습니다. 토큰이 Git 히스토리에 남을 수 있습니다.

---

## 단계별 실행

### Step 1: Personal Access Token 생성

1. GitHub > Settings > Developer settings > Personal access tokens > Tokens (classic)
2. "Generate new token (classic)" 클릭
3. `repo` 권한 선택
4. 토큰 생성 및 복사

### Step 2: Git Credential Helper 설정 (선택사항)

```bash
git config --global credential.helper osxkeychain
```

### Step 3: 푸시

```bash
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"

# 변경사항 확인
git status

# 변경사항 추가
git add .

# 커밋
git commit -m "Complete migration to Supabase and Cloudinary"

# 푸시
git push -u origin main
```

프롬프트가 나타나면:
- Username: `istandby4u2-png`
- Password: **Personal Access Token** 입력

---

## 문제 해결

### 문제 1: "token is invalid"

**해결:**
- 토큰을 정확히 복사했는지 확인
- 토큰이 만료되지 않았는지 확인
- 새 토큰 생성

### 문제 2: "permission denied"

**해결:**
- `repo` 권한이 체크되어 있는지 확인
- 토큰을 다시 생성

### 문제 3: 매번 토큰 입력해야 함

**해결:**
```bash
# Git credential helper 설정
git config --global credential.helper osxkeychain
```

---

## 보안 주의사항

1. **토큰을 공유하지 마세요**
2. **토큰을 코드에 커밋하지 마세요**
3. **토큰이 만료되면 새로 생성하세요**
4. **불필요한 토큰은 삭제하세요**

---

## 다음 단계

푸시가 성공하면:

1. ✅ GitHub 저장소에서 파일 확인
2. ✅ Vercel에서 배포
3. ✅ 프로덕션 환경 테스트

문제가 계속되면 알려주세요!
