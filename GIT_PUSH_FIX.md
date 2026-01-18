# Git 푸시 문제 해결 가이드

## 현재 상황

- 로컬 브랜치가 원격보다 1 커밋 앞서 있음
- 원격 저장소에 로컬에 없는 변경사항이 있음
- Git 푸시가 거부됨

---

## 해결 방법

### 방법 1: 원격 변경사항 가져오기 (권장)

터미널에서 다음 명령어를 순서대로 실행하세요:

```bash
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"

# 1. 원격 변경사항 가져오기
git pull origin main

# 2. 충돌이 있으면 해결 (충돌이 없으면 이 단계 건너뛰기)
# 충돌 파일을 열어서 수정한 후:
# git add <충돌파일>
# git commit -m "Resolve merge conflicts"

# 3. 푸시
git push origin main
```

---

### 방법 2: 강제 푸시 (주의: 원격 변경사항 손실 가능)

**⚠️ 주의:** 이 방법은 원격 저장소의 변경사항을 덮어씁니다. 다른 사람과 협업 중이면 사용하지 마세요.

```bash
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"

# 강제 푸시 (원격 변경사항 무시)
git push origin main --force
```

---

## 단계별 가이드

### Step 1: 현재 상태 확인

```bash
git status
```

예상 출력:
- `Your branch is ahead of 'origin/main' by 1 commit.`
- 변경된 파일 목록

---

### Step 2: 원격 변경사항 가져오기

```bash
git pull origin main
```

**결과에 따른 다음 단계:**

#### A. 성공적으로 병합됨
```
Already up to date.
```
또는
```
Merge made by the 'recursive' strategy.
```
→ **Step 3로 진행**

#### B. 충돌 발생
```
Auto-merging <파일명>
CONFLICT (content): Merge conflict in <파일명>
```
→ **충돌 해결 필요 (아래 참고)**

---

### Step 3: 충돌 해결 (필요한 경우)

1. **충돌 파일 확인**
   ```bash
   git status
   ```

2. **충돌 파일 열기**
   - 충돌 파일을 에디터로 열기
   - 충돌 마커 찾기:
     ```
     <<<<<<< HEAD
     (로컬 변경사항)
     =======
     (원격 변경사항)
     >>>>>>> origin/main
     ```

3. **충돌 해결**
   - 필요한 코드만 남기고 충돌 마커 제거
   - 파일 저장

4. **충돌 해결 완료 표시**
   ```bash
   git add <충돌파일>
   git commit -m "Resolve merge conflicts"
   ```

---

### Step 4: 푸시

```bash
git push origin main
```

---

## 네트워크 인증서 문제 해결

만약 다음 오류가 발생하면:

```
error setting certificate verify locations: CAfile: /etc/ssl/cert.pem CApath: none
```

### 해결 방법 1: Git SSL 검증 비활성화 (임시)

```bash
git config --global http.sslVerify false
```

**⚠️ 보안상 권장하지 않지만, 임시로 사용 가능**

### 해결 방법 2: 인증서 경로 설정

```bash
# macOS의 경우
git config --global http.sslCAInfo /usr/local/etc/openssl/cert.pem
```

또는

```bash
# Homebrew로 설치한 경우
git config --global http.sslCAInfo /opt/homebrew/etc/openssl/cert.pem
```

---

## 빠른 해결 (권장 순서)

1. **원격 변경사항 가져오기**
   ```bash
   cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"
   git pull origin main
   ```

2. **충돌이 있으면 해결**
   - 충돌 파일 수정
   - `git add <파일>`
   - `git commit -m "Resolve conflicts"`

3. **푸시**
   ```bash
   git push origin main
   ```

---

## 확인사항

푸시 성공 후:

1. **GitHub에서 확인**
   - https://github.com/istandby4u2-png/runlog
   - 최근 커밋 확인

2. **Vercel 자동 재배포 확인**
   - Vercel 대시보드에서 배포 상태 확인
   - 자동으로 재배포가 시작됩니다

---

## 문제가 계속되면

1. **Git 상태 확인**
   ```bash
   git status
   git log --oneline -5
   ```

2. **원격 저장소 확인**
   ```bash
   git remote -v
   ```

3. **강제 푸시 (최후의 수단)**
   ```bash
   git push origin main --force
   ```
   **⚠️ 다른 사람과 협업 중이면 사용하지 마세요!**

---

## 다음 단계

1. ✅ Git 푸시 완료
2. ⏭️ Vercel 자동 재배포 대기
3. ⏭️ 프로덕션에서 로그인 테스트
4. ⏭️ 오류 메시지 확인

**터미널에서 위의 명령어를 실행해보시고, 결과를 알려주세요!**
