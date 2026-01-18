# 칼로리 계산 기능 디버깅 가이드

## 문제: 칼로리가 계산되지 않음

칼로리 계산이 작동하지 않는 경우 다음을 확인하세요.

## 1단계: .env 파일 확인

터미널에서:
```bash
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"
grep GEMINI_API_KEY .env
```

**결과:**
- 키가 있으면: `GEMINI_API_KEY=AIzaSyCz-ZPlMtzFjkXvGuV0HP22sWupJp7uL_4` 같은 줄이 표시됨
- 키가 없으면: 아무것도 표시되지 않음

**키가 없으면 추가:**
```bash
echo "" >> .env
echo "# Gemini API Key" >> .env
echo "GEMINI_API_KEY=AIzaSyCz-ZPlMtzFjkXvGuV0HP22sWupJp7uL_4" >> .env
```

## 2단계: 서버 재시작

`.env` 파일을 수정한 후 **반드시 서버를 재시작**해야 합니다:

```bash
# 서버 중지: Ctrl + C
# 서버 재시작
npm run dev
```

## 3단계: 브라우저 콘솔 확인

1. 브라우저에서 `F12` 또는 `Cmd + Option + I`로 개발자 도구 열기
2. **Console** 탭 선택
3. 기록 등록 페이지로 이동
4. "러닝 전 식사" 입력란에 텍스트 입력
5. 콘솔에 다음 메시지들이 표시되는지 확인:
   - `칼로리 계산 요청: ...`
   - `API 응답 상태: 200` (성공 시)
   - `칼로리 계산 성공: ...` (성공 시)
   - 또는 에러 메시지

## 4단계: 서버 터미널 확인

서버를 실행한 터미널에서 다음 메시지들을 확인:

**서버 시작 시:**
- `✅ GEMINI_API_KEY가 설정되었습니다.` (정상)
- 또는 `⚠️ GEMINI_API_KEY가 설정되지 않았습니다.` (문제)

**칼로리 계산 시:**
- `📝 칼로리 계산 API 호출: ...`
- `🔄 칼로리 계산 시작...`
- `📥 Gemini API 원본 응답: ...`
- `✅ 칼로리 계산 성공: ...` (성공 시)
- 또는 에러 메시지

## 5단계: Network 탭 확인

1. 브라우저 개발자 도구 → **Network** 탭
2. 기록 등록 페이지에서 식사 입력
3. `/api/calories` 요청 찾기
4. 클릭하여 확인:
   - **Status**: 200이면 성공, 500이면 서버 오류
   - **Response**: 응답 내용 확인
   - **Preview**: JSON 데이터 확인

## 일반적인 문제와 해결

### 문제 1: "GEMINI_API_KEY가 설정되지 않았습니다"
**해결:**
1. `.env` 파일에 키 추가
2. 서버 재시작

### 문제 2: "칼로리 계산에 실패했습니다"
**가능한 원인:**
- API 키가 잘못됨
- API 할당량 초과
- 네트워크 문제

**해결:**
1. API 키 확인: [Google AI Studio](https://makersuite.google.com/app/apikey)
2. 서버 터미널의 에러 메시지 확인
3. 네트워크 연결 확인

### 문제 3: "칼로리 계산 중..."이 계속 표시됨
**가능한 원인:**
- API 응답이 오지 않음
- 타임아웃

**해결:**
1. 브라우저 콘솔 확인
2. 서버 터미널 확인
3. 네트워크 연결 확인

## 테스트 방법

브라우저 콘솔에서 직접 테스트:
```javascript
fetch('/api/calories', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ meal: '치킨 한 마리, 콜라 500ml' })
})
  .then(r => r.json())
  .then(data => console.log('결과:', data))
  .catch(err => console.error('오류:', err))
```

## 예상 결과

**성공 시:**
```json
{ "calories": 1200 }
```

**실패 시:**
```json
{ "error": "칼로리 계산에 실패했습니다..." }
```

## 추가 도움말

문제가 계속되면 다음 정보를 확인하세요:
1. 브라우저 콘솔의 전체 에러 메시지
2. 서버 터미널의 전체 로그
3. Network 탭의 `/api/calories` 요청 상세 정보
