# 빠른 시작 가이드

## 개발 서버 실행 방법

### 1단계: 터미널 열기
- macOS: `Cmd + Space` → "터미널" 입력 → Enter
- 또는 Finder에서 "응용 프로그램" → "유틸리티" → "터미널"

### 2단계: 프로젝트 디렉토리로 이동
터미널에 다음 명령어를 복사해서 붙여넣으세요:

```bash
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"
```

**중요**: 경로에 공백이 있으므로 따옴표(`"`)를 반드시 포함해야 합니다!

### 3단계: 현재 위치 확인 (선택사항)
```bash
pwd
```

다음과 같이 표시되어야 합니다:
```
/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서
```

### 4단계: package.json 확인 (선택사항)
```bash
ls package.json
```

`package.json` 파일이 보여야 합니다.

### 5단계: 개발 서버 실행
```bash
npm run dev
```

### 6단계: 브라우저에서 접속
서버가 시작되면 다음 메시지가 표시됩니다:
```
  ▲ Next.js 14.2.35
  - Local:        http://localhost:3000
  ✓ Ready in X.Xs
```

브라우저에서 **http://localhost:3000** 을 열어주세요.

## 서버 중지 방법

터미널에서 `Ctrl + C`를 누르면 서버가 중지됩니다.

## 문제 해결

### "package.json을 찾을 수 없습니다" 오류
- **원인**: 프로젝트 디렉토리가 아닌 곳에서 명령어를 실행함
- **해결**: 위의 2단계를 다시 확인하고 정확한 경로로 이동

### 경로에 공백이 있어서 오류 발생
- **해결**: 경로를 따옴표로 감싸기
  ```bash
  cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"
  ```

### 한 번에 실행하기
터미널에서 다음 명령어를 한 줄로 실행:
```bash
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서" && npm run dev
```

## 자주 사용하는 명령어

```bash
# 프로젝트 디렉토리로 이동
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"

# 개발 서버 실행
npm run dev

# 의존성 설치 (처음 한 번만)
npm install

# 서버 중지
Ctrl + C
```

## 팁

### 터미널에서 경로 자동완성
1. `cd "/Users/user/Library/Mobile` 까지 입력
2. `Tab` 키를 누르면 자동완성됨
3. 계속 `Tab`을 눌러서 경로 완성

### 별칭(alias) 설정 (선택사항)
터미널 설정 파일(`~/.zshrc` 또는 `~/.bashrc`)에 추가:
```bash
alias runlog='cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서" && npm run dev'
```

그러면 언제든지 `runlog` 명령어만 입력하면 서버가 시작됩니다.
