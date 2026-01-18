# ChunkLoadError 해결 가이드

## 현재 문제
```
ChunkLoadError: Loading chunk app/records/new/page failed.
```

이 오류는 Next.js 빌드 파일(`.next` 폴더)이 손상되었거나 불완전하게 생성되었을 때 발생합니다.

## 해결 방법

### 방법 1: .next 폴더 삭제 후 재시작 (권장)

터미널에서 다음 명령어를 실행하세요:

```bash
# 1. 프로젝트 디렉토리로 이동
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"

# 2. 서버 중지 (실행 중인 경우)
# 터미널에서 Ctrl + C 키를 누르세요

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

## 확인

서버를 재시작한 후:

1. 브라우저에서 `http://localhost:3000` 접속
2. F12를 눌러 개발자 도구 열기
3. Network 탭에서 404 에러가 사라졌는지 확인
4. 페이지가 정상적으로 로드되는지 확인

## 예상 결과

- `.next` 폴더가 자동으로 재생성됩니다
- 빌드 파일들이 정상적으로 생성됩니다
- ChunkLoadError가 사라집니다
- 페이지가 정상적으로 로드됩니다

## 주의사항

- 서버를 중지한 후 `.next` 폴더를 삭제하세요
- `.next` 폴더는 빌드 결과물이므로 삭제해도 안전합니다 (자동으로 재생성됨)
- `node_modules`는 삭제하지 않아도 됩니다

## 한 줄로 실행

```bash
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서" && rm -rf .next && npm run dev
```

## 여전히 문제가 있는 경우

위의 방법을 시도했는데도 ChunkLoadError가 계속되면:

1. **브라우저 캐시 삭제**
   - 브라우저에서 `Ctrl + Shift + R` (또는 `Cmd + Shift + R` on Mac)로 강력 새로고침
   - 또는 브라우저 개발자 도구에서 "Disable cache" 체크

2. **포트 충돌 확인**
   ```bash
   lsof -ti:3000
   ```
   포트를 사용하는 프로세스가 있다면:
   ```bash
   kill -9 $(lsof -ti:3000)
   ```

3. **Node.js 버전 확인**
   - LTS 버전 사용 권장 (v18 또는 v20)

4. **node_modules 재설치** (최후의 수단)
   ```bash
   cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"
   rm -rf node_modules .next
   npm install
   npm run dev
   ```
