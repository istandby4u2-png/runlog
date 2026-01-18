# 오류 확인 체크리스트

## 어떤 오류가 발생했나요?

다음 정보를 알려주시면 정확한 해결 방법을 제시할 수 있습니다:

## 1. 오류 메시지 확인

### 브라우저에서 확인:
1. **F12** 키를 눌러 개발자 도구 열기
2. **Console** 탭에서 빨간색 에러 메시지 확인
3. **Network** 탭에서 `/api/calories` 요청 클릭
4. **Response** 탭에서 응답 내용 확인

### 서버 터미널에서 확인:
`npm run dev`를 실행한 터미널에서:
- `❌` 표시가 있는 에러 메시지 확인
- 전체 에러 로그 복사

## 2. 일반적인 오류 유형

### 오류 유형 A: "칼로리 계산에 실패했습니다"
**원인:** GEMINI_API_KEY가 설정되지 않았거나 Gemini API 호출 실패

**해결:**
1. `.env` 파일에 `GEMINI_API_KEY=AIzaSyCz-ZPlMtzFjkXvGuV0HP22sWupJp7uL_4` 확인
2. 서버 재시작 (Ctrl + C 후 `npm run dev`)
3. 서버 시작 시 `✅ GEMINI_API_KEY가 설정되었습니다.` 메시지 확인

### 오류 유형 B: "500 Internal Server Error"
**원인:** 서버 측 오류

**해결:**
1. 서버 터미널의 에러 로그 확인
2. 브라우저 Network 탭의 Response 내용 확인
3. `/api/calories/test` 엔드포인트 확인

### 오류 유형 C: "GEMINI_API_KEY가 설정되지 않았습니다"
**원인:** 환경 변수가 로드되지 않음

**해결:**
1. `.env` 파일 위치 확인 (프로젝트 루트에 있어야 함)
2. `.env` 파일 형식 확인 (공백 없이 `KEY=value`)
3. 서버 재시작

### 오류 유형 D: 네트워크 오류 또는 연결 실패
**원인:** 서버가 실행되지 않음 또는 포트 충돌

**해결:**
1. 서버가 실행 중인지 확인 (`npm run dev`)
2. `http://localhost:3000` 접속 가능한지 확인
3. 다른 터미널에서 서버 실행 중인지 확인

## 3. 빠른 진단

### 단계 1: API 상태 확인
브라우저에서:
```
http://localhost:3000/api/calories/test
```

**정상:**
```json
{
  "geminiApiKey": {
    "exists": true
  }
}
```

**문제:**
```json
{
  "geminiApiKey": {
    "exists": false
  }
}
```

### 단계 2: 서버 시작 메시지 확인
서버를 시작할 때 (`npm run dev`) 터미널에:
```
✅ GEMINI_API_KEY가 설정되었습니다.
```
이 메시지가 표시되어야 합니다.

### 단계 3: .env 파일 확인
터미널에서:
```bash
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"
grep GEMINI_API_KEY .env
```

다음과 같이 표시되어야 합니다:
```
GEMINI_API_KEY=AIzaSyCz-ZPlMtzFjkXvGuV0HP22sWupJp7uL_4
```

## 4. 완전 초기화 (모든 것이 실패할 때)

```bash
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"

# .env 파일 확인/생성
cat > .env << 'EOF'
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyCY6pkLokXVXdDEg78KRofqNdG2qWODve8
JWT_SECRET=your_jwt_secret_change_in_production_use_random_string
DATABASE_PATH=./data/running.db
PORT=3000
GEMINI_API_KEY=AIzaSyCz-ZPlMtzFjkXvGuV0HP22sWupJp7uL_4
EOF

# .next 폴더 삭제
rm -rf .next

# 서버 재시작
npm run dev
```

## 5. 필요한 정보

다음 정보를 알려주시면 정확한 해결 방법을 제시할 수 있습니다:

1. **오류 메시지 전체 내용** (브라우저 콘솔 또는 서버 터미널)
2. **브라우저 Network 탭의 Response 내용** (`/api/calories` 요청)
3. **서버 시작 시 메시지** (`✅ GEMINI_API_KEY가 설정되었습니다.`가 있는지)
4. **`/api/calories/test` 응답 내용**

## 6. 즉시 시도할 수 있는 해결 방법

```bash
# 1. 프로젝트 디렉토리로 이동
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"

# 2. .env 파일에 GEMINI_API_KEY 추가 (없는 경우)
echo "GEMINI_API_KEY=AIzaSyCz-ZPlMtzFjkXvGuV0HP22sWupJp7uL_4" >> .env

# 3. 서버 중지 (Ctrl + C)

# 4. 서버 재시작
npm run dev
```

서버 시작 시 `✅ GEMINI_API_KEY가 설정되었습니다.` 메시지가 표시되는지 확인하세요.
