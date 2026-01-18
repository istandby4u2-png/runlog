# 문제 해결 가이드

## better-sqlite3 빌드 오류 해결

### 문제
```
npm error gyp ERR! build error
npm error gyp ERR! stack Error: `make` failed with exit code: 2
```

### 원인
Node.js v24.13.0은 매우 최신 버전이며, `better-sqlite3`가 아직 완전히 지원하지 않을 수 있습니다.

### 해결 방법

#### 방법 1: Node.js LTS 버전 사용 (권장)

**Node.js v18 LTS 또는 v20 LTS를 사용하세요.**

1. **nvm (Node Version Manager) 설치** (권장)
   ```bash
   # Homebrew로 nvm 설치
   brew install nvm
   
   # 또는 공식 설치 스크립트
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   ```

2. **터미널 재시작 후 nvm 사용**
   ```bash
   # Node.js v20 LTS 설치
   nvm install 20
   nvm use 20
   nvm alias default 20
   ```

3. **버전 확인**
   ```bash
   node --version  # v20.x.x 나와야 함
   ```

4. **의존성 재설치**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

#### 방법 2: better-sqlite3 최신 버전 사용

`package.json`에서 better-sqlite3 버전을 최신으로 업데이트:

```json
"better-sqlite3": "^11.0.0"
```

그 다음:
```bash
rm -rf node_modules package-lock.json
npm install
```

#### 방법 3: 빌드 도구 재설치

```bash
# Xcode Command Line Tools 재설치
sudo xcode-select --install

# 또는 업데이트
softwareupdate --all --install --force
```

#### 방법 4: Python 버전 확인

better-sqlite3는 Python이 필요할 수 있습니다:

```bash
python3 --version
# Python 3.x가 필요합니다
```

#### 방법 5: npm 캐시 정리

```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

## Node.js 버전 확인 및 변경

### 현재 버전 확인
```bash
node --version
npm --version
```

### nvm 없이 Node.js 재설치

1. [Node.js 공식 사이트](https://nodejs.org/)에서 **LTS 버전** 다운로드
2. 기존 Node.js 제거 (선택사항)
3. 새 버전 설치

### nvm 사용 (권장)

nvm을 사용하면 여러 Node.js 버전을 쉽게 관리할 수 있습니다:

```bash
# nvm 설치 확인
nvm --version

# 사용 가능한 버전 확인
nvm list-remote

# LTS 버전 설치
nvm install --lts

# 특정 버전 사용
nvm use 20

# 기본 버전 설정
nvm alias default 20
```

## 대안: 다른 데이터베이스 사용

better-sqlite3 대신 다른 옵션을 사용할 수도 있습니다:

### 옵션 1: sql.js (순수 JavaScript)
- 네이티브 빌드 불필요
- 브라우저에서도 작동
- 성능은 약간 낮음

### 옵션 2: PostgreSQL 또는 MySQL
- 프로덕션 환경에 적합
- 별도 서버 필요

## 빠른 해결 (임시)

개발 환경에서만 사용할 경우, better-sqlite3 없이 시작할 수 있도록 코드를 수정할 수도 있습니다. 하지만 이는 권장하지 않습니다.

## 권장 사항

**가장 좋은 해결책**: Node.js v20 LTS 사용

```bash
# nvm 설치 후
nvm install 20
nvm use 20
npm install
```

이렇게 하면 대부분의 호환성 문제가 해결됩니다.
