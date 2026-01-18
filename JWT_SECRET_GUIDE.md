# JWT_SECRET 생성 가이드

## JWT_SECRET이란?

`JWT_SECRET`은 JWT(JSON Web Token) 토큰을 서명하고 검증하는 데 사용되는 비밀 키입니다. 
- **외부 서비스에서 제공되지 않습니다**
- **직접 생성해야 합니다**
- **보안을 위해 충분히 길고 예측 불가능한 랜덤 문자열이어야 합니다**

---

## JWT_SECRET 생성 방법

### 방법 1: 터미널에서 자동 생성 (추천)

#### macOS/Linux:
```bash
openssl rand -base64 32
```

#### 또는 더 긴 키 (64자):
```bash
openssl rand -base64 64
```

#### 또는 Node.js 사용:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 방법 2: 온라인 생성기 사용

1. [randomkeygen.com](https://randomkeygen.com/) 접속
2. "CodeIgniter Encryption Keys" 섹션에서 키 선택
3. 또는 "Fort Knox Password" 섹션에서 긴 문자열 선택

### 방법 3: 수동으로 생성

최소 32자 이상의 임의의 문자열을 생성하세요:
- 영문 대소문자
- 숫자
- 특수문자

예시 (이것을 사용하지 마세요, 예시일 뿐입니다):
```
MySuperSecretJWTKey2024!@#$%^&*()_+-=[]{}|;:,.<>?
```

---

## .env 파일에 설정하기

생성한 JWT_SECRET을 `.env` 파일에 추가하세요:

```env
JWT_SECRET=여기에_생성한_랜덤_문자열_붙여넣기
```

**예시:**
```env
JWT_SECRET=K8j3mN9pQ2rT5vX8zA1bC4dE7fG0hI3jK6lM9nO2pQ5rS8tU1vW4xY7zA0bC3dE6f
```

---

## 주의사항

### ⚠️ 보안
- **절대 GitHub에 커밋하지 마세요!**
- `.env` 파일은 `.gitignore`에 포함되어 있어야 합니다
- 프로덕션 환경에서는 더 긴 키(64자 이상) 사용 권장
- 로컬 개발과 프로덕션 환경에서 다른 키 사용 권장

### ✅ 요구사항
- 최소 32자 이상
- 예측 불가능한 랜덤 문자열
- 영문, 숫자, 특수문자 조합 권장

---

## 빠른 생성 (터미널)

터미널에서 다음 명령을 실행하세요:

```bash
openssl rand -base64 32
```

출력된 문자열을 복사하여 `.env` 파일의 `JWT_SECRET`에 붙여넣으세요.

---

## 확인 방법

`.env` 파일에 올바르게 설정되었는지 확인:

```bash
# macOS/Linux
cat .env | grep JWT_SECRET

# 또는
grep JWT_SECRET .env
```

출력 예시:
```
JWT_SECRET=K8j3mN9pQ2rT5vX8zA1bC4dE7fG0hI3jK6lM9nO2pQ5rS8tU1vW4xY7zA0bC3dE6f
```

---

## 다음 단계

JWT_SECRET 생성 완료 후:
1. ✅ `.env` 파일에 추가
2. ✅ 개발 서버 재시작 (`npm run dev`)
3. ✅ Vercel 배포 시에도 동일한 키를 환경 변수로 설정

---

## 문제 해결

### "JWT_SECRET이 설정되지 않았습니다" 오류
- `.env` 파일에 `JWT_SECRET`이 있는지 확인
- 키 이름이 정확한지 확인 (`JWT_SECRET`, 대소문자 구분)
- 개발 서버를 재시작했는지 확인

### 키가 너무 짧은 경우
- 최소 32자 이상 사용하세요
- 더 긴 키(64자) 사용 권장
