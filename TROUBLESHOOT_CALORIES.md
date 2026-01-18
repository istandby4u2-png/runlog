# 칼로리 계산 문제 해결 가이드

## 문제: "칼로리 계산에 실패했습니다. GEMINI_API_KEY가 .env 파일에 설정되어 있는지 확인해주세요."

.env 파일에 키가 있는데도 실패하는 경우, 다음을 확인하세요.

## 1단계: 서버 재시작 확인

**가장 중요한 단계입니다!**

`.env` 파일을 수정한 후 **반드시 서버를 재시작**해야 합니다:

```bash
# 터미널에서 서버 중지
Ctrl + C

# 서버 재시작
npm run dev
```

## 2단계: 서버 시작 시 메시지 확인

서버를 시작할 때 터미널에 다음 메시지가 표시되어야 합니다:

**정상:**
```
✅ GEMINI_API_KEY가 설정되었습니다.
```

**문제:**
```
⚠️ GEMINI_API_KEY가 설정되지 않았습니다.
⚠️ .env 파일에 GEMINI_API_KEY=your_api_key 형식으로 추가해주세요.
```

## 3단계: .env 파일 형식 확인

터미널에서 다음 명령어로 확인:

```bash
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"
cat .env | grep GEMINI
```

**올바른 형식:**
```
GEMINI_API_KEY=AIzaSyCz-ZPlMtzFjkXvGuV0HP22sWupJp7uL_4
```

**잘못된 형식 (작동하지 않음):**
```
GEMINI_API_KEY = AIzaSyCz-ZPlMtzFjkXvGuV0HP22sWupJp7uL_4  # 공백 있음
GEMINI_API_KEY="AIzaSyCz-ZPlMtzFjkXvGuV0HP22sWupJp7uL_4"  # 따옴표 있음
GEMINI_API_KEY= AIzaSyCz-ZPlMtzFjkXvGuV0HP22sWupJp7uL_4  # 등호 뒤 공백
```

## 4단계: 서버 터미널 로그 확인

식사를 입력할 때 서버 터미널에 다음 로그가 표시되어야 합니다:

**정상 흐름:**
```
📝 칼로리 계산 API 호출: 치킨 한 마리
🔑 GEMINI_API_KEY 확인: 설정됨 (길이: 39)
🔄 칼로리 계산 시작...
🔍 칼로리 계산 시작: 치킨 한 마리
✅ Gemini 모델 초기화 완료: gemini-1.5-flash
📥 Gemini API 원본 응답: 1200
✅ 칼로리 계산 성공: 1200 kcal
📊 계산 결과: 1200
✅ 칼로리 계산 성공: 1200
```

**문제가 있는 경우:**
```
🔑 GEMINI_API_KEY 확인: ❌ 설정되지 않음
```

또는

```
❌ Gemini API 오류: ...
오류 메시지: ...
```

## 5단계: .env 파일 위치 확인

`.env` 파일은 **프로젝트 루트 디렉토리**에 있어야 합니다:

```
/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서/.env
```

`package.json` 파일과 같은 위치에 있어야 합니다.

## 6단계: .env 파일 내용 확인

터미널에서:
```bash
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"
cat .env
```

다음과 같이 표시되어야 합니다:
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyCY6pkLokXVXdDEg78KRofqNdG2qWODve8
JWT_SECRET=your_jwt_secret_change_in_production_use_random_string
DATABASE_PATH=./data/running.db
PORT=3000
GEMINI_API_KEY=AIzaSyCz-ZPlMtzFjkXvGuV0HP22sWupJp7uL_4
```

## 해결 방법

### 방법 1: .env 파일 재작성

터미널에서:
```bash
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"

# 기존 .env 백업 (선택사항)
cp .env .env.backup

# .env 파일에 Gemini API 키 추가 (이미 있으면 건너뛰기)
grep -q "GEMINI_API_KEY" .env || echo "GEMINI_API_KEY=AIzaSyCz-ZPlMtzFjkXvGuV0HP22sWupJp7uL_4" >> .env
```

### 방법 2: 서버 완전 재시작

```bash
# 서버 중지
Ctrl + C

# .next 폴더 삭제 (선택사항)
rm -rf .next

# 서버 재시작
npm run dev
```

### 방법 3: 환경 변수 직접 확인

서버가 실행 중일 때, API 라우트에서 환경 변수를 확인할 수 있도록 로그가 추가되었습니다.

서버 터미널에서 다음 메시지를 확인:
- `🔑 GEMINI_API_KEY 확인: 설정됨 (길이: 39)` ← 정상
- `🔑 GEMINI_API_KEY 확인: ❌ 설정되지 않음` ← 문제

## 일반적인 문제

### 문제 1: 서버를 재시작하지 않음
**해결:** 서버를 중지하고 다시 시작

### 문제 2: .env 파일 형식 오류
**해결:** 공백 없이 `KEY=value` 형식으로 작성

### 문제 3: .env 파일 위치 오류
**해결:** 프로젝트 루트 디렉토리에 있는지 확인

### 문제 4: API 키가 잘못됨
**해결:** [Google AI Studio](https://makersuite.google.com/app/apikey)에서 새 키 발급

## 확인 체크리스트

- [ ] .env 파일이 프로젝트 루트에 있음
- [ ] GEMINI_API_KEY=값 형식으로 작성됨 (공백 없음)
- [ ] 서버 시작 시 "✅ GEMINI_API_KEY가 설정되었습니다." 메시지 표시
- [ ] 서버를 재시작했음
- [ ] 서버 터미널에 "🔑 GEMINI_API_KEY 확인: 설정됨" 메시지 표시

## 다음 단계

위의 체크리스트를 모두 확인했는데도 문제가 계속되면:
1. 서버 터미널의 전체 로그를 복사해서 알려주세요
2. 브라우저 콘솔의 에러 메시지를 알려주세요
3. Network 탭의 `/api/calories` 요청 상세 정보를 알려주세요
