# 칼로리 계산 문제 빠른 진단 가이드

## 1단계: API 상태 확인 (브라우저에서)

브라우저에서 다음 URL을 열어보세요:

```
http://localhost:3000/api/calories/test
```

**정상적인 응답:**
```json
{
  "status": "ok",
  "geminiApiKey": {
    "exists": true,
    "length": 39,
    "preview": "AIzaSyCz-Z..."
  },
  "message": "✅ GEMINI_API_KEY가 설정되어 있습니다.",
  "instructions": "칼로리 계산 기능을 사용할 수 있습니다."
}
```

**문제가 있는 경우:**
```json
{
  "status": "ok",
  "geminiApiKey": {
    "exists": false,
    "length": 0,
    "preview": "not set"
  },
  "message": "❌ GEMINI_API_KEY가 설정되지 않았습니다.",
  "instructions": ".env 파일에 GEMINI_API_KEY=your_api_key 형식으로 추가하고 서버를 재시작하세요."
}
```

## 2단계: 브라우저 콘솔 확인

1. 브라우저에서 `F12` 키를 눌러 개발자 도구 열기
2. **Console** 탭 선택
3. 기록 등록 페이지에서 식사를 입력
4. 콘솔에 표시되는 로그 확인

**정상적인 경우:**
```
칼로리 계산 요청: 치킨 한 마리
API 응답 상태: 200
API 응답 데이터: {calories: 1200}
칼로리 계산 성공: 1200
```

**문제가 있는 경우:**
```
칼로리 계산 요청: 치킨 한 마리
API 응답 상태: 500
❌ API 오류 상세: {
  status: 500,
  error: "칼로리 계산에 실패했습니다...",
  details: "..."
}
```

## 3단계: 서버 터미널 확인

`npm run dev`를 실행한 터미널에서:

**서버 시작 시:**
- `✅ GEMINI_API_KEY가 설정되었습니다.` 메시지 확인

**식사 입력 시:**
- `📝 칼로리 계산 API 호출:` 메시지 확인
- `🔑 GEMINI_API_KEY 확인:` 메시지 확인
- `❌` 표시가 있는 에러 메시지 확인

## 4단계: .env 파일 확인

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

## 5단계: 서버 재시작

`.env` 파일을 수정했다면 **반드시** 서버를 재시작:

```bash
# 터미널에서
Ctrl + C  # 서버 중지
npm run dev  # 서버 재시작
```

## 문제별 해결 방법

### 문제 1: `/api/calories/test`에서 `exists: false`
**원인:** `.env` 파일에 `GEMINI_API_KEY`가 없거나 서버가 재시작되지 않음

**해결:**
1. `.env` 파일에 `GEMINI_API_KEY=AIzaSyCz-ZPlMtzFjkXvGuV0HP22sWupJp7uL_4` 추가
2. 서버 재시작

### 문제 2: 서버 터미널에 `❌ GEMINI_API_KEY 확인: ❌ 설정되지 않음`
**원인:** 환경 변수가 로드되지 않음

**해결:**
1. `.env` 파일 위치 확인 (프로젝트 루트에 있어야 함)
2. `.env` 파일 형식 확인 (공백 없이 `KEY=value`)
3. 서버 재시작

### 문제 3: `❌ Gemini API 오류 발생!`
**원인:** Gemini API 호출 실패 (API 키 오류, 네트워크 문제 등)

**해결:**
1. API 키가 올바른지 확인
2. [Google AI Studio](https://makersuite.google.com/app/apikey)에서 새 키 발급
3. 네트워크 연결 확인

### 문제 4: `❌ 칼로리 계산 실패: 숫자를 찾을 수 없음`
**원인:** Gemini API가 숫자가 아닌 형식으로 응답

**해결:**
- 서버 터미널의 "📥 Gemini API 원본 응답:" 로그 확인
- 응답 내용을 알려주시면 수정하겠습니다

## 다음 단계

위의 단계를 따라 확인한 후, 다음 정보를 알려주세요:

1. `/api/calories/test` 응답 내용
2. 브라우저 콘솔의 에러 메시지
3. 서버 터미널의 에러 로그 (특히 `❌` 표시가 있는 부분)

이 정보를 주시면 정확한 원인을 파악할 수 있습니다.
