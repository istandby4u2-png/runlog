# Git Pull 및 Push 가이드

## 현재 상황

- 로컬에 "Improve login API error handling" 커밋이 있음
- 원격 저장소에 로컬에 없는 커밋이 있음
- `non-fast-forward` 오류 발생

---

## 해결 방법

### Step 1: 원격 변경사항 가져오기

터미널에서 다음 명령어를 실행하세요:

```bash
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"

# 원격 변경사항 가져오기
git pull origin main
```

---

### Step 2: 충돌 해결 (필요한 경우)

#### A. 충돌이 없는 경우

```
Already up to date.
```
또는
```
Merge made by the 'recursive' strategy.
```
→ **Step 3로 진행**

#### B. 충돌이 있는 경우

```
Auto-merging app/api/auth/login/route.ts
CONFLICT (content): Merge conflict in app/api/auth/login/route.ts
```

**충돌 해결 방법:**

1. **충돌 파일 열기**
   - `app/api/auth/login/route.ts` 파일을 에디터로 열기

2. **충돌 마커 찾기**
   ```
   <<<<<<< HEAD
   (로컬 변경사항 - 개선된 코드)
   =======
   (원격 변경사항)
   >>>>>>> origin/main
   ```

3. **충돌 해결**
   - 개선된 코드(로컬 변경사항)를 유지
   - 충돌 마커(`<<<<<<<`, `=======`, `>>>>>>>`) 제거
   - 파일 저장

4. **충돌 해결 완료**
   ```bash
   git add app/api/auth/login/route.ts
   git commit -m "Merge remote changes and keep login API improvements"
   ```

---

### Step 3: 푸시

```bash
git push origin main
```

---

## 전체 명령어 (한 번에 실행)

터미널에서 다음 명령어를 순서대로 실행:

```bash
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"

# 1. 원격 변경사항 가져오기
git pull origin main

# 2. 충돌이 있으면 해결 (위의 Step 2 참고)

# 3. 푸시
git push origin main
```

---

## 네트워크 인증서 문제 해결

다음 오류가 발생하면:

```
error setting certificate verify locations: CAfile: /etc/ssl/cert.pem CApath: none
```

**임시 해결:**

```bash
# SSL 검증 비활성화 (임시)
git config --global http.sslVerify false

# 다시 pull 시도
git pull origin main

# 푸시
git push origin main
```

---

## 강제 푸시 (최후의 수단)

**⚠️ 주의:** 이 방법은 원격 저장소의 변경사항을 덮어씁니다. 다른 사람과 협업 중이면 사용하지 마세요.

```bash
git push origin main --force
```

---

## 예상 시나리오

### 시나리오 1: 충돌 없음

```bash
$ git pull origin main
Already up to date.

$ git push origin main
Enumerating objects: 5, done.
Counting objects: 100% (5/5), done.
Writing objects: 100% (3/3), done.
To https://github.com/istandby4u2-png/runlog.git
   <원격커밋>..<로컬커밋>  main -> main
```

✅ 성공!

---

### 시나리오 2: 충돌 발생

```bash
$ git pull origin main
Auto-merging app/api/auth/login/route.ts
CONFLICT (content): Merge conflict in app/api/auth/login/route.ts
Automatic merge failed; fix conflicts and then commit the result.
```

**해결:**
1. 충돌 파일 수정 (개선된 코드 유지)
2. `git add app/api/auth/login/route.ts`
3. `git commit -m "Resolve merge conflicts"`
4. `git push origin main`

---

## 확인사항

푸시 성공 후:

1. **GitHub 확인**
   - https://github.com/istandby4u2-png/runlog
   - 최근 커밋에 "Improve login API error handling" 확인

2. **Vercel 자동 재배포**
   - Vercel 대시보드에서 배포 상태 확인
   - 자동으로 재배포가 시작됩니다

---

## 문제 해결 체크리스트

- [ ] `git pull origin main` 실행
- [ ] 충돌 해결 (있는 경우)
- [ ] `git push origin main` 실행
- [ ] GitHub에서 커밋 확인
- [ ] Vercel 재배포 확인

---

## 다음 단계

1. ✅ Git 푸시 완료
2. ⏭️ Vercel 자동 재배포 대기
3. ⏭️ 프로덕션에서 로그인 테스트
4. ⏭️ 오류 메시지 확인

**터미널에서 위의 명령어를 실행해보시고, 결과를 알려주세요!**
