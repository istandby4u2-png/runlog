# .env 파일 설정 가이드

## 문제
경로 끝에 `#`이 포함되어 에러가 발생했습니다. 주석이 포함된 명령어를 실행하지 마세요.

## 해결 방법

### 방법 1: 수동으로 .env 파일 편집 (권장)

1. 프로젝트 폴더에서 `.env` 파일을 텍스트 에디터로 엽니다
2. 다음 내용이 있는지 확인합니다:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyCY6pkLokXVXdDEg78KRofqNdG2qWODve8
JWT_SECRET=your_jwt_secret_change_in_production_use_random_string
DATABASE_PATH=./data/running.db
PORT=3000
GEMINI_API_KEY=AIzaSyCz-ZPlMtzFjkXvGuV0HP22sWupJp7uL_4
```

3. `GEMINI_API_KEY` 줄이 없으면 추가합니다
4. 파일을 저장합니다
5. 서버를 재시작합니다

### 방법 2: 터미널에서 직접 추가 (주석 없이)

터미널에서 다음 명령어를 **한 줄씩** 실행하세요:

```bash
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"
```

그 다음:

```bash
echo "GEMINI_API_KEY=AIzaSyCz-ZPlMtzFjkXvGuV0HP22sWupJp7uL_4" >> .env
```

**주의:** `#` 주석이 포함된 명령어는 실행하지 마세요!

### 방법 3: .env 파일 전체 재작성

터미널에서:

```bash
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"
```

그 다음 다음 명령어를 실행 (주석 없이):

```bash
cat > .env << 'ENVFILE'
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyCY6pkLokXVXdDEg78KRofqNdG2qWODve8
JWT_SECRET=your_jwt_secret_change_in_production_use_random_string
DATABASE_PATH=./data/running.db
PORT=3000
GEMINI_API_KEY=AIzaSyCz-ZPlMtzFjkXvGuV0HP22sWupJp7uL_4
ENVFILE
```

## 확인

터미널에서:

```bash
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"
grep GEMINI_API_KEY .env
```

다음과 같이 표시되어야 합니다:
```
GEMINI_API_KEY=AIzaSyCz-ZPlMtzFjkXvGuV0HP22sWupJp7uL_4
```

## 서버 재시작

.env 파일을 수정한 후 **반드시** 서버를 재시작하세요:

```bash
# 서버 중지
Ctrl + C

# 서버 재시작
npm run dev
```

서버 시작 시 다음 메시지가 표시되어야 합니다:
```
✅ GEMINI_API_KEY가 설정되었습니다.
```

## 중요 사항

- **주석(`#`)이 포함된 명령어는 실행하지 마세요**
- **경로에 공백이 있으므로 따옴표로 감싸야 합니다**
- **.env 파일을 수정한 후 반드시 서버를 재시작해야 합니다**
