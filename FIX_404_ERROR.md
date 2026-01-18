# 404 에러 해결 가이드

## 현재 문제
다음 파일들이 404 에러를 반환하고 있습니다:
- `layout.css`
- `main-app.js`
- `app-pages-internals.js`
- `layout.js`
- `page.js`

## 원인
Next.js 빌드 파일(`.next` 폴더)이 손상되었거나 불완전하게 생성되었습니다.

## 해결 방법

### 방법 1: .next 폴더 삭제 후 재시작 (권장)

터미널에서 다음 명령어를 실행하세요:

```bash
# 1. 프로젝트 디렉토리로 이동
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"

# 2. 서버 중지 (실행 중인 경우)
# Ctrl + C

# 3. .next 폴더 삭제
rm -rf .next

# 4. 서버 재시작
npm run dev
```

### 방법 2: 완전 초기화

```bash
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"

# 서버 중지
# Ctrl + C

# 빌드 파일 삭제
rm -rf .next

# 캐시 삭제 (있다면)
rm -rf node_modules/.cache

# 서버 재시작
npm run dev
```

### 방법 3: node_modules 재설치 (필요한 경우)

위 방법이 작동하지 않으면:

```bash
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"

# 서버 중지
# Ctrl + C

# .next 폴더 삭제
rm -rf .next

# node_modules 재설치 (선택사항)
rm -rf node_modules
npm install

# 서버 재시작
npm run dev
```

## 확인

서버를 재시작한 후:

1. 브라우저에서 `http://localhost:3000` 접속
2. F12를 눌러 개발자 도구 열기
3. Network 탭에서 404 에러가 사라졌는지 확인
4. 페이지가 정상적으로 로드되는지 확인

## 예상 결과

서버를 재시작하면:
- `.next` 폴더가 자동으로 재생성됩니다
- 빌드 파일들이 정상적으로 생성됩니다
- 404 에러가 사라집니다
- 페이지가 정상적으로 로드됩니다

## 주의사항

- 서버를 중지한 후 `.next` 폴더를 삭제하세요
- `.next` 폴더는 빌드 결과물이므로 삭제해도 안전합니다 (자동으로 재생성됨)
- `node_modules`는 삭제하지 않아도 됩니다 (필요한 경우에만)

## 여전히 문제가 있는 경우

위의 방법을 시도했는데도 404 에러가 계속되면:

1. **서버 터미널의 에러 메시지** 확인
2. **브라우저 콘솔의 에러 메시지** 확인
3. **포트 충돌** 확인 (다른 프로세스가 3000 포트를 사용 중인지)
4. **Node.js 버전** 확인 (LTS 버전 권장)

포트 충돌 확인:
```bash
lsof -ti:3000
```

포트를 사용하는 프로세스가 있다면:
```bash
kill -9 $(lsof -ti:3000)
```

그 다음 서버를 다시 시작하세요.
