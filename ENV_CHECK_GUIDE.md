# .env 파일 확인 가이드

## 방법 1: 터미널에서 확인 (가장 빠름)

### 1단계: 프로젝트 디렉토리로 이동
터미널을 열고 다음 명령어를 실행하세요:

```bash
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"
```

### 2단계: .env 파일이 있는지 확인
```bash
ls -la .env
```

**결과:**
- 파일이 있으면: `.env` 파일 목록이 표시됨
- 파일이 없으면: `No such file or directory` 에러

### 3단계: Gemini API 키 확인
```bash
grep GEMINI_API_KEY .env
```

**결과:**
- 키가 있으면: `GEMINI_API_KEY=AIzaSyCz-ZPlMtzFjkXvGuV0HP22sWupJp7uL_4` 같은 줄이 표시됨
- 키가 없으면: 아무것도 표시되지 않음

### 4단계: 전체 .env 파일 내용 확인
```bash
cat .env
```

또는

```bash
less .env
```

## 방법 2: Finder에서 확인

### 1단계: Finder 열기
- Finder를 엽니다

### 2단계: 프로젝트 폴더로 이동
다음 경로로 이동:
```
/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서
```

### 3단계: 숨김 파일 표시
- `Command + Shift + .` (점) 키를 누르면 숨김 파일이 표시됩니다
- `.env` 파일이 보일 것입니다

### 4단계: 파일 열기
- `.env` 파일을 더블클릭하거나
- 텍스트 에디터(텍스트 편집기, VS Code 등)로 열기

## 방법 3: VS Code에서 확인

### 1단계: VS Code에서 프로젝트 열기
```bash
code "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"
```

### 2단계: .env 파일 열기
- 좌측 파일 탐색기에서 `.env` 파일 클릭
- 또는 `Command + P`를 누르고 `.env` 입력

### 3단계: 내용 확인
파일에 다음이 포함되어 있어야 합니다:
```env
GEMINI_API_KEY=AIzaSyCz-ZPlMtzFjkXvGuV0HP22sWupJp7uL_4
```

## .env 파일이 없거나 키가 없는 경우

### .env 파일 생성/수정

터미널에서:
```bash
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"

# .env 파일이 없으면 생성
cat > .env << 'EOF'
# Google Maps API Key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyCY6pkLokXVXdDEg78KRofqNdG2qWODve8

# JWT Secret
JWT_SECRET=your_jwt_secret_change_in_production_use_random_string

# Database Path
DATABASE_PATH=./data/running.db

# Server Port
PORT=3000

# Gemini API Key
GEMINI_API_KEY=AIzaSyCz-ZPlMtzFjkXvGuV0HP22sWupJp7uL_4
EOF
```

또는 기존 .env 파일에 추가:
```bash
echo "" >> .env
echo "# Gemini API Key" >> .env
echo "GEMINI_API_KEY=AIzaSyCz-ZPlMtzFjkXvGuV0HP22sWupJp7uL_4" >> .env
```

## 올바른 .env 파일 형식

```env
# Google Maps API Key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyCY6pkLokXVXdDEg78KRofqNdG2qWODve8

# JWT Secret
JWT_SECRET=your_jwt_secret_change_in_production_use_random_string

# Database Path
DATABASE_PATH=./data/running.db

# Server Port
PORT=3000

# Gemini API Key
GEMINI_API_KEY=AIzaSyCz-ZPlMtzFjkXvGuV0HP22sWupJp7uL_4
```

## 주의사항

1. **공백 없이**: `GEMINI_API_KEY=값` 형식으로 작성 (등호 앞뒤 공백 없음)
2. **따옴표 없이**: 값에 따옴표를 사용하지 않음
3. **주석**: `#`으로 시작하는 줄은 주석
4. **줄바꿈**: 각 환경 변수는 새 줄에 작성

## 확인 명령어 모음

```bash
# .env 파일 존재 확인
test -f .env && echo "파일 있음" || echo "파일 없음"

# Gemini API 키 확인
grep -q "GEMINI_API_KEY" .env && echo "키 있음" || echo "키 없음"

# 키 값 확인 (값만 출력)
grep "GEMINI_API_KEY" .env | cut -d '=' -f2

# 모든 API 키 확인
grep "API_KEY" .env
```

## 문제 해결

### 키가 있는데도 작동하지 않는 경우

1. **서버 재시작**: `.env` 파일을 수정한 후 반드시 서버를 재시작해야 합니다
   ```bash
   # 서버 중지 (Ctrl + C)
   # 서버 재시작
   npm run dev
   ```

2. **키 형식 확인**: 공백이나 특수문자가 없는지 확인
   ```bash
   cat .env | grep GEMINI
   ```

3. **환경 변수 로드 확인**: 서버 시작 시 키가 로드되는지 확인
   - 서버 시작 시 에러 메시지 확인
   - 콘솔에 "GEMINI_API_KEY가 설정되지 않았습니다" 경고가 없어야 함
