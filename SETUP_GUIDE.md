# 개발 환경 설정 가이드

## 문제: localhost:3000에 연결할 수 없음

이 문제는 보통 다음 중 하나의 이유 때문입니다:
1. Node.js가 설치되지 않음
2. 의존성 패키지가 설치되지 않음
3. 개발 서버가 실행되지 않음

## 해결 방법

### 1단계: Node.js 설치 확인

터미널에서 다음 명령어를 실행하세요:

```bash
node --version
npm --version
```

**결과가 나오지 않으면**: Node.js가 설치되지 않은 것입니다.

#### Node.js 설치 방법

**macOS:**
1. [Node.js 공식 웹사이트](https://nodejs.org/)에서 LTS 버전 다운로드
2. 또는 Homebrew 사용:
   ```bash
   brew install node
   ```

**설치 확인:**
```bash
node --version  # v18.x.x 이상 권장
npm --version   # 9.x.x 이상
```

### 2단계: 프로젝트 디렉토리로 이동

```bash
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"
```

### 3단계: 의존성 패키지 설치

```bash
npm install
```

이 명령어는 `package.json`에 정의된 모든 패키지를 설치합니다. 몇 분 정도 걸릴 수 있습니다.

**성공 메시지 예시:**
```
added 234 packages, and audited 235 packages in 2m
```

### 4단계: .env 파일 생성

프로젝트 루트 디렉토리에 `.env` 파일을 생성하고 다음 내용을 추가하세요:

```env
# Google Maps API Key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyCY6pkLokXVXdDEg78KRofqNdG2qWODve8

# JWT Secret
JWT_SECRET=your_jwt_secret_change_in_production_use_random_string

# Database Path
DATABASE_PATH=./data/running.db

# Server Port
PORT=3000
```

**macOS/Linux에서 파일 생성:**
```bash
cat > .env << 'EOF'
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyCY6pkLokXVXdDEg78KRofqNdG2qWODve8
JWT_SECRET=your_jwt_secret_change_in_production_use_random_string
DATABASE_PATH=./data/running.db
PORT=3000
EOF
```

### 5단계: 개발 서버 실행

```bash
npm run dev
```

**성공 메시지 예시:**
```
  ▲ Next.js 14.0.4
  - Local:        http://localhost:3000
  - Ready in 2.3s
```

### 6단계: 브라우저에서 확인

브라우저에서 다음 주소를 열어보세요:
- http://localhost:3000

## 문제 해결

### 포트 3000이 이미 사용 중인 경우

다른 프로세스가 포트 3000을 사용하고 있을 수 있습니다.

**포트 사용 확인:**
```bash
lsof -i :3000
```

**해결 방법:**
1. 해당 프로세스 종료
2. 또는 다른 포트 사용:
   ```bash
   PORT=3001 npm run dev
   ```

### 의존성 설치 오류

**npm 캐시 정리:**
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### 권한 오류 (macOS)

```bash
sudo npm install -g npm
```

### 빌드 오류

TypeScript 오류나 다른 빌드 오류가 발생하면:

```bash
# TypeScript 타입 확인
npx tsc --noEmit

# Next.js 빌드 테스트
npm run build
```

## 전체 설정 순서 요약

```bash
# 1. Node.js 버전 확인
node --version
npm --version

# 2. 프로젝트 디렉토리로 이동
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"

# 3. 의존성 설치
npm install

# 4. .env 파일 생성 (위 내용 참고)

# 5. 개발 서버 실행
npm run dev

# 6. 브라우저에서 http://localhost:3000 열기
```

## 추가 도움말

- **Node.js 설치**: https://nodejs.org/
- **npm 문서**: https://docs.npmjs.com/
- **Next.js 문서**: https://nextjs.org/docs

문제가 계속되면 터미널의 전체 에러 메시지를 확인하세요.
