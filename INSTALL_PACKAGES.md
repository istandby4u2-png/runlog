# 패키지 설치 가이드

## 문제

오류 메시지:
```
Error: Module not found: Can't resolve '@supabase/supabase-js'
```

**원인:** 필요한 패키지가 설치되지 않았습니다.

---

## 해결 방법

### 터미널에서 패키지 설치

터미널에서 다음 명령을 실행하세요:

```bash
# 1. 프로젝트 디렉토리로 이동
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"

# 2. 패키지 설치
npm install
```

또는 특정 패키지만 설치:

```bash
npm install @supabase/supabase-js cloudinary
```

---

## 설치 확인

설치가 완료되면:

```bash
# node_modules 폴더 확인
ls node_modules | grep supabase
ls node_modules | grep cloudinary
```

---

## 서버 재시작

패키지 설치 후 개발 서버를 재시작하세요:

```bash
# 서버 중지 (Ctrl + C)
# 재시작
npm run dev
```

---

## 설치할 패키지 목록

다음 패키지들이 설치되어야 합니다:

- `@supabase/supabase-js` - Supabase 클라이언트
- `cloudinary` - Cloudinary 이미지 업로드

이미 `package.json`에 포함되어 있으므로 `npm install`만 실행하면 됩니다.

---

## 문제 해결

### 권한 오류가 발생한다면

```bash
# sudo 없이 시도
npm install

# 또는 프로젝트 디렉토리 권한 확인
ls -la
```

### node_modules가 손상되었다면

```bash
# node_modules 삭제 후 재설치
rm -rf node_modules
npm install
```

---

## 다음 단계

패키지 설치 완료 후:

1. ✅ 개발 서버 재시작: `npm run dev`
2. ✅ 브라우저에서 `http://localhost:3000` 접속
3. ✅ Internal Server Error가 해결되었는지 확인
