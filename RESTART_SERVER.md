# 서버 재시작 가이드

## 중요: 올바른 디렉토리에서 실행하세요!

서버를 재시작하려면 **프로젝트 루트 디렉토리**에서 실행해야 합니다.

## 올바른 방법

### 1단계: 프로젝트 디렉토리로 이동

터미널에서 다음 명령어를 실행하세요:

```bash
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"
```

### 2단계: 서버 중지 (실행 중인 경우)

서버가 실행 중이라면:
- 터미널에서 `Ctrl + C` 키를 누르세요
- **주의:** `Ctrl + C`는 명령어가 아니라 키보드 단축키입니다!

### 3단계: 서버 재시작

```bash
npm run dev
```

## 한 줄로 실행

```bash
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서" && npm run dev
```

## 주의사항

### ❌ 잘못된 방법
```bash
# 서버 중지  # <- 이것은 주석입니다, 명령어가 아닙니다!
Ctrl + C     # <- 이것도 명령어가 아닙니다!
npm run dev  # <- 주석이 포함된 명령어는 실행되지 않습니다
```

### ✅ 올바른 방법
```bash
# 1. 디렉토리 이동
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"

# 2. 서버 중지 (실행 중인 경우)
# 터미널에서 Ctrl + C 키를 누르세요 (명령어가 아닙니다!)

# 3. 서버 재시작
npm run dev
```

## 확인

서버가 정상적으로 시작되면:

1. 터미널에 다음 메시지가 표시됩니다:
```
✅ GEMINI_API_KEY가 설정되었습니다.
```

2. 브라우저에서 `http://localhost:3000` 접속 가능

3. 서버 터미널에 다음과 같은 메시지가 표시됩니다:
```
  ▲ Next.js 14.x.x
  - Local:        http://localhost:3000
```

## 문제 해결

### 문제 1: "command not found: #"
**원인:** 주석(`#`)을 명령어로 실행하려고 함
**해결:** 주석은 무시하고 실제 명령어만 실행하세요

### 문제 2: "command not found: Ctrl"
**원인:** `Ctrl + C`를 명령어로 입력함
**해결:** `Ctrl + C`는 키보드 단축키입니다. 터미널에서 `Ctrl` 키와 `C` 키를 동시에 누르세요

### 문제 3: "Could not read package.json"
**원인:** 프로젝트 루트 디렉토리가 아님
**해결:** 먼저 `cd` 명령어로 프로젝트 디렉토리로 이동하세요

## 빠른 참조

```bash
# 프로젝트 디렉토리로 이동
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"

# 서버 중지 (실행 중인 경우)
# 터미널에서 Ctrl + C 키를 누르세요

# 서버 재시작
npm run dev
```

## 팁

- 현재 디렉토리를 확인하려면: `pwd`
- `package.json`이 있는지 확인하려면: `ls package.json`
- 프로젝트 디렉토리에 있는지 확인하려면: `test -f package.json && echo "맞습니다" || echo "틀렸습니다"`
