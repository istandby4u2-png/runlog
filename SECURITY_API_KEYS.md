# 🔒 API 키 보안 가이드

## ⚠️ 중요: API 키가 GitHub에 노출된 경우

GitHub 저장소에 API 키가 노출되어 있다면 **즉시 다음 조치를 취하세요:**

---

## 🚨 즉시 조치 사항

### 1. 모든 API 키 즉시 교체

노출된 API 키는 **즉시 무효화하고 새로 발급**받아야 합니다.

#### Google Maps API 키 교체

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. **APIs & Services > Credentials** 이동
3. 노출된 API 키 찾기
4. **Delete** 또는 **Restrict** 클릭
5. 새 API 키 생성
6. **API 제한 설정** (중요!)
   - Maps JavaScript API만 허용
   - HTTP referrer 제한 설정

#### Supabase API 키 교체

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택
3. **Settings > API** 이동
4. **Reset API keys** 클릭
5. 새 키 생성 후 Vercel 환경 변수 업데이트

#### Cloudinary API 키 교체

1. [Cloudinary Dashboard](https://cloudinary.com/console) 접속
2. **Settings > Security** 이동
3. **API Keys** 섹션에서 키 재생성
4. Vercel 환경 변수 업데이트

#### Gemini API 키 교체

1. [Google AI Studio](https://makersuite.google.com/app/apikey) 접속
2. 기존 키 삭제
3. 새 키 생성
4. Vercel 환경 변수 업데이트

#### JWT Secret 교체

1. 새 JWT Secret 생성:
   ```bash
   openssl rand -base64 32
   ```
2. Vercel 환경 변수 업데이트

---

## 🔍 노출된 키 확인 방법

### Git 히스토리에서 확인

```bash
# 모든 커밋에서 API 키 검색
git log --all --full-history -p | grep -i "API.*KEY\|SECRET\|PASSWORD\|TOKEN"

# 특정 파일의 히스토리 확인
git log --all --full-history -- .env
```

### GitHub에서 확인

1. GitHub 저장소 접속
2. **Code > Search** 사용
3. API 키 패턴 검색:
   - `AIzaSy` (Google Maps/Gemini)
   - `sb_` (Supabase)
   - `CLOUDINARY_API`
   - `JWT_SECRET`

---

## 🛡️ API 키 보호 방법

### 1. .env 파일 사용 (현재 적용됨)

✅ `.env` 파일은 `.gitignore`에 포함되어 있습니다.

**확인:**
```bash
cat .gitignore | grep .env
```

**결과:**
```
.env*.local
.env
```

### 2. 환경 변수만 사용

❌ **절대 하드코딩하지 마세요:**
```typescript
// ❌ 나쁜 예
const apiKey = "AIzaSyCY6pkLokXVXdDEg78KRofqNdG2qWODve8";

// ✅ 좋은 예
const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
```

### 3. Vercel 환경 변수 설정

모든 API 키는 **Vercel 환경 변수**로만 관리:

1. Vercel Dashboard 접속
2. 프로젝트 선택
3. **Settings > Environment Variables** 이동
4. 모든 API 키 추가:
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
   - `GEMINI_API_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - `JWT_SECRET`

### 4. API 키 제한 설정

#### Google Maps API 키 제한

1. Google Cloud Console > APIs & Services > Credentials
2. API 키 선택
3. **API restrictions** 설정:
   - ✅ Maps JavaScript API
   - ✅ Maps Embed API (필요한 경우)
4. **Application restrictions** 설정:
   - HTTP referrers (web sites)
   - 허용된 도메인 추가:
     - `localhost:3000`
     - `*.vercel.app`
     - `yourdomain.com`

#### Supabase API 키

- **Anon Key**: 공개되어도 되지만 Row Level Security (RLS) 정책으로 보호
- **Service Role Key**: 절대 공개하지 마세요!

#### Cloudinary API 키

- **API Key**: 공개 가능 (서명된 URL 사용)
- **API Secret**: 절대 공개하지 마세요!

---

## 🧹 Git 히스토리에서 제거

### 방법 1: BFG Repo-Cleaner (권장)

```bash
# BFG 설치 (Homebrew)
brew install bfg

# .env 파일 히스토리에서 제거
bfg --delete-files .env

# 또는 특정 키 제거
bfg --replace-text passwords.txt
```

### 방법 2: git-filter-repo

```bash
# git-filter-repo 설치
pip install git-filter-repo

# .env 파일 히스토리에서 제거
git filter-repo --path .env --invert-paths
```

### 방법 3: 새 저장소 생성 (가장 안전)

1. 새 저장소 생성
2. 현재 코드 복사 (`.env` 제외)
3. 새 저장소에 푸시
4. Vercel 프로젝트 재연결

---

## ✅ 보안 체크리스트

- [ ] 모든 API 키 교체 완료
- [ ] `.env` 파일이 `.gitignore`에 포함됨
- [ ] 코드에 하드코딩된 키 없음
- [ ] Vercel 환경 변수 설정 완료
- [ ] Google Maps API 키 제한 설정 완료
- [ ] Git 히스토리에서 민감한 정보 제거
- [ ] GitHub 저장소에서 노출된 키 확인 및 제거

---

## 📝 .env.example 파일 생성

`.env.example` 파일을 생성하여 필요한 환경 변수 목록을 공유:

```bash
# .env.example
# Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name_here
CLOUDINARY_API_KEY=your_cloudinary_api_key_here
CLOUDINARY_API_SECRET=your_cloudinary_api_secret_here

# JWT
JWT_SECRET=your_jwt_secret_here
```

**중요:** `.env.example`은 Git에 포함해도 되지만, 실제 키 값은 넣지 마세요!

---

## 🚨 비상 조치

API 키가 노출되어 악용되고 있다면:

1. **즉시 모든 키 무효화**
2. **사용량 모니터링** (Google Cloud Console, Supabase Dashboard)
3. **비정상적인 사용량 확인**
4. **새 키 발급 및 교체**
5. **Git 히스토리 정리**

---

## 📚 추가 리소스

- [GitHub 보안 모범 사례](https://docs.github.com/en/code-security)
- [Vercel 환경 변수 가이드](https://vercel.com/docs/concepts/projects/environment-variables)
- [Google Cloud API 키 보안](https://cloud.google.com/docs/authentication/api-keys)

---

## 요약

1. ✅ **즉시 모든 API 키 교체**
2. ✅ **Vercel 환경 변수로만 관리**
3. ✅ **코드에 하드코딩 금지**
4. ✅ **API 키 제한 설정**
5. ✅ **Git 히스토리 정리**

**보안은 지속적인 과정입니다. 정기적으로 API 키를 확인하고 교체하세요!**
