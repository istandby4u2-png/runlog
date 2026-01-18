# 500 에러 디버깅 가이드

## 현재 상황
`/api/calories` 엔드포인트에서 **500 Internal Server Error**가 발생하고 있습니다.

## 1단계: 브라우저 Network 탭에서 응답 확인

1. 브라우저에서 `F12` 키를 눌러 개발자 도구 열기
2. **Network** 탭 선택
3. 기록 등록 페이지에서 식사를 입력
4. `/api/calories` 요청 클릭
5. **Response** 탭 선택하여 응답 본문 확인

**응답 예시:**
```json
{
  "error": "칼로리 계산에 실패했습니다...",
  "details": "..."
}
```

또는

```json
{
  "error": "서버 오류가 발생했습니다: ...",
  "errorType": "...",
  "details": "..."
}
```

## 2단계: 서버 터미널 로그 확인

`npm run dev`를 실행한 터미널에서 다음 로그를 확인하세요:

### 정상적인 경우:
```
📝 칼로리 계산 API 호출: 치킨 한 마리
🔑 GEMINI_API_KEY 확인: 설정됨 (길이: 39)
🔄 칼로리 계산 시작...
🔍 칼로리 계산 시작: 치킨 한 마리
✅ Gemini 모델 초기화 완료: gemini-1.5-flash
📥 Gemini API 원본 응답: 1200
✅ 칼로리 계산 성공: 1200 kcal
```

### 문제가 있는 경우:

#### 문제 1: API 키 없음
```
🔑 GEMINI_API_KEY 확인: ❌ 설정되지 않음
❌ GEMINI_API_KEY가 설정되지 않았습니다.
```

**해결:**
1. `.env` 파일에 `GEMINI_API_KEY=AIzaSyCz-ZPlMtzFjkXvGuV0HP22sWupJp7uL_4` 추가
2. 서버 재시작

#### 문제 2: Gemini API 호출 실패
```
❌ Gemini API 오류 발생!
❌ 오류 메시지: [에러 메시지]
❌ HTTP 상태: [상태 코드]
```

**가능한 원인:**
- API 키가 잘못됨
- API 키에 권한이 없음
- 네트워크 연결 문제
- Gemini API 서비스 장애

#### 문제 3: 예상치 못한 오류
```
❌ Calculate calories API 오류 발생!
❌ 오류 타입: [타입]
❌ 오류 메시지: [메시지]
❌ 스택 트레이스: [스택]
```

## 3단계: API 상태 테스트

브라우저에서 다음 URL을 열어보세요:

```
http://localhost:3000/api/calories/test
```

**정상:**
```json
{
  "status": "ok",
  "geminiApiKey": {
    "exists": true,
    "length": 39,
    "preview": "AIzaSyCz-Z..."
  },
  "message": "✅ GEMINI_API_KEY가 설정되어 있습니다."
}
```

**문제:**
```json
{
  "status": "ok",
  "geminiApiKey": {
    "exists": false,
    "length": 0,
    "preview": "not set"
  },
  "message": "❌ GEMINI_API_KEY가 설정되지 않았습니다."
}
```

## 4단계: 서버 시작 시 메시지 확인

서버를 시작할 때 (`npm run dev`) 터미널에 다음 메시지가 표시되어야 합니다:

**정상:**
```
✅ GEMINI_API_KEY가 설정되었습니다.
```

**문제:**
```
⚠️ GEMINI_API_KEY가 설정되지 않았습니다.
⚠️ .env 파일에 GEMINI_API_KEY=your_api_key 형식으로 추가해주세요.
```

## 5단계: .env 파일 확인

터미널에서:
```bash
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"
cat .env | grep GEMINI_API_KEY
```

**올바른 형식:**
```
GEMINI_API_KEY=AIzaSyCz-ZPlMtzFjkXvGuV0HP22sWupJp7uL_4
```

**잘못된 형식:**
```
GEMINI_API_KEY = AIzaSyCz-ZPlMtzFjkXvGuV0HP22sWupJp7uL_4  # 공백 있음
GEMINI_API_KEY="AIzaSyCz-ZPlMtzFjkXvGuV0HP22sWupJp7uL_4"  # 따옴표 있음
```

## 해결 방법

### 방법 1: 서버 재시작
```bash
# 터미널에서
Ctrl + C  # 서버 중지
npm run dev  # 서버 재시작
```

### 방법 2: .env 파일 재작성
```bash
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"

# .env 파일에 Gemini API 키 추가
echo "GEMINI_API_KEY=AIzaSyCz-ZPlMtzFjkXvGuV0HP22sWupJp7uL_4" >> .env

# 서버 재시작
npm run dev
```

### 방법 3: .next 폴더 삭제 후 재시작
```bash
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"
rm -rf .next
npm run dev
```

## 다음 단계

다음 정보를 알려주시면 정확한 원인을 파악할 수 있습니다:

1. **브라우저 Network 탭의 Response 내용** (가장 중요!)
2. **서버 터미널의 에러 로그** (특히 `❌` 표시가 있는 부분)
3. **서버 시작 시 메시지** (`✅ GEMINI_API_KEY가 설정되었습니다.`가 있는지)
4. **`/api/calories/test` 응답 내용**
