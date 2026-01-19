# 🔐 API 키 전체 교체 완전 가이드

## 📋 개요

이 가이드는 노출된 모든 API 키를 안전하게 교체하는 단계별 방법을 제공합니다.

**예상 소요 시간:** 30-60분

---

## 🚨 교체 전 확인 사항

### 1. 현재 사용 중인 키 목록

다음 키들을 모두 교체해야 합니다:

- ✅ Google Maps API 키
- ✅ Gemini API 키
- ✅ Supabase Anon Key
- ✅ Supabase Service Role Key ⚠️ **가장 위험**
- ✅ Cloudinary API Key
- ✅ Cloudinary API Secret ⚠️ **매우 위험**
- ✅ JWT Secret ⚠️ **매우 위험**

### 2. 교체 순서

**우선순위 순서로 교체하세요:**

1. **Supabase Service Role Key** (가장 위험)
2. **Cloudinary API Secret** (매우 위험)
3. **JWT Secret** (매우 위험)
4. **Google Maps API 키**
5. **Gemini API 키**
6. **Supabase Anon Key**
7. **Cloudinary API Key**

---

## 1️⃣ Supabase API 키 교체

### Step 1: Supabase Dashboard 접속

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 로그인
3. 프로젝트 선택 (예: `heytensiqyzqscptkcym`)

### Step 2: API 키 확인

1. 왼쪽 메뉴에서 **Settings** 클릭
2. **API** 섹션 클릭
3. 현재 키 확인:
   - **Project URL**: `https://heytensiqyzqscptkcym.supabase.co`
   - **anon public**: `sb_publishable_7rARXtWTwlJunQ1VfEAZ3w_yWRkVz1X` ⚠️ 노출됨
   - **service_role secret**: `sb_secret_1NPYzgAMyWC8IvXNRUH0Kw_HBx4bDEd` ⚠️ 노출됨

### Step 3: Service Role Key 재생성 (가장 중요!)

1. **API** 페이지에서 **Reset API keys** 버튼 클릭
2. 확인 대화상자에서 **"Reset service_role key"** 선택
3. **⚠️ 경고 확인**: 이 작업은 되돌릴 수 없습니다
4. **Reset** 클릭
5. **새 Service Role Key 복사** (한 번만 표시됨!)
   - 예: `sb_secret_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Step 4: Anon Key 재생성 (선택사항)

**참고:** Anon Key는 공개되어도 되지만, 보안을 위해 재생성하는 것을 권장합니다.

1. **Reset API keys** 버튼 클릭
2. **"Reset anon key"** 선택
3. **Reset** 클릭
4. **새 Anon Key 복사**
   - 예: `sb_publishable_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Step 5: Vercel 환경 변수 업데이트

1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. 프로젝트 선택
3. **Settings** > **Environment Variables** 이동
4. 다음 변수 찾기:
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. 각 변수 클릭 > **Edit**
6. 새 키 값 입력
7. **Save** 클릭
8. **⚠️ 중요:** 모든 환경(Production, Preview, Development)에 적용되었는지 확인

### Step 6: 로컬 .env 파일 업데이트

1. 프로젝트 루트의 `.env` 파일 열기
2. 다음 값 업데이트:
   ```env
   NEXT_PUBLIC_SUPABASE_ANON_KEY=새로운_anon_key
   SUPABASE_SERVICE_ROLE_KEY=새로운_service_role_key
   ```
3. 파일 저장

### Step 7: 애플리케이션 재배포

1. Vercel Dashboard에서 **Deployments** 탭 이동
2. 최신 배포 옆 **"..."** 메뉴 클릭
3. **Redeploy** 선택
4. 배포 완료 대기 (2-5분)

---

## 2️⃣ Cloudinary API 키 교체

### Step 1: Cloudinary Dashboard 접속

1. [Cloudinary Dashboard](https://cloudinary.com/console) 접속
2. 로그인
3. 계정 선택

### Step 2: 현재 키 확인

1. 왼쪽 메뉴에서 **Settings** 클릭
2. **Security** 탭 클릭
3. **API Keys** 섹션 확인:
   - **Cloud name**: `dwcx3cxxd`
   - **API Key**: `889538896366331` ⚠️ 노출됨
   - **API Secret**: `cxGoHkFn5FdUxwFzNqGY8qAaTMI` ⚠️ 노출됨

### Step 3: API Secret 재생성

1. **API Keys** 섹션에서 **"Regenerate API Secret"** 버튼 클릭
2. **⚠️ 경고 확인**: 이 작업은 되돌릴 수 없습니다
3. **Regenerate** 클릭
4. **새 API Secret 복사** (한 번만 표시됨!)
   - 예: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

**참고:** API Key는 재생성할 수 없지만, Secret만 재생성해도 충분합니다.

### Step 4: Vercel 환경 변수 업데이트

1. Vercel Dashboard > **Settings** > **Environment Variables**
2. 다음 변수 찾기:
   - `CLOUDINARY_API_SECRET`
3. 변수 클릭 > **Edit**
4. 새 Secret 값 입력
5. **Save** 클릭

### Step 5: 로컬 .env 파일 업데이트

```env
CLOUDINARY_API_SECRET=새로운_api_secret
```

### Step 6: 애플리케이션 재배포

Vercel에서 재배포 실행

---

## 3️⃣ JWT Secret 교체

### Step 1: 새 JWT Secret 생성

터미널에서 다음 명령어 실행:

```bash
openssl rand -base64 32
```

**출력 예시:**
```
XyZ123AbC456DeF789GhI012JkL345MnO678PqR901StU234VwX567YzA890=
```

**⚠️ 중요:** 이 값을 복사하세요. 다시 생성하면 다른 값이 나옵니다.

### Step 2: Vercel 환경 변수 업데이트

1. Vercel Dashboard > **Settings** > **Environment Variables**
2. `JWT_SECRET` 변수 찾기
3. 변수 클릭 > **Edit**
4. 새 Secret 값 입력
5. **Save** 클릭

### Step 3: 로컬 .env 파일 업데이트

```env
JWT_SECRET=새로운_jwt_secret
```

### Step 4: 애플리케이션 재배포

**⚠️ 중요:** JWT Secret을 변경하면 **모든 사용자 세션이 무효화**됩니다. 사용자들은 재로그인해야 합니다.

---

## 4️⃣ Google Maps API 키 교체

### Step 1: Google Cloud Console 접속

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 로그인
3. 프로젝트 선택

### Step 2: 현재 키 확인

1. 왼쪽 메뉴에서 **APIs & Services** > **Credentials** 이동
2. API 키 목록에서 다음 키 찾기:
   - `AIzaSyCY6pkLokXVXdDEg78KRofqNdG2qWODve8` ⚠️ 노출됨

### Step 3: 기존 키 삭제 또는 제한

**옵션 1: 키 삭제 (권장)**

1. 키 클릭
2. **Delete** 버튼 클릭
3. 확인

**옵션 2: 키 제한 (임시 조치)**

1. 키 클릭
2. **API restrictions** 설정:
   - ✅ Maps JavaScript API만 허용
3. **Application restrictions** 설정:
   - HTTP referrers (web sites)
   - 허용된 도메인 추가:
     - `localhost:3000`
     - `*.vercel.app`
     - `yourdomain.com` (있는 경우)
4. **Save** 클릭

### Step 4: 새 API 키 생성

1. **APIs & Services** > **Credentials** 이동
2. **+ CREATE CREDENTIALS** 클릭
3. **API key** 선택
4. 새 키가 생성됨
5. **키 복사** (예: `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`)

### Step 5: 새 키 제한 설정 (중요!)

1. 생성된 키 클릭
2. **API restrictions** 설정:
   - **Restrict key** 선택
   - ✅ **Maps JavaScript API** 체크
   - ✅ **Maps Embed API** 체크 (필요한 경우)
3. **Application restrictions** 설정:
   - **HTTP referrers (web sites)** 선택
   - **Website restrictions** 섹션에서 **ADD AN ITEM** 클릭
   - 다음 도메인 추가:
     ```
     localhost:3000/*
     *.vercel.app/*
     yourdomain.com/* (있는 경우)
     ```
4. **Save** 클릭

### Step 6: Vercel 환경 변수 업데이트

1. Vercel Dashboard > **Settings** > **Environment Variables**
2. `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` 변수 찾기
3. 변수 클릭 > **Edit**
4. 새 키 값 입력
5. **Save** 클릭

### Step 7: 로컬 .env 파일 업데이트

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=새로운_google_maps_api_key
```

### Step 8: 애플리케이션 재배포

Vercel에서 재배포 실행

---

## 5️⃣ Gemini API 키 교체

### Step 1: Google AI Studio 접속

1. [Google AI Studio](https://makersuite.google.com/app/apikey) 접속
2. 로그인

### Step 2: 현재 키 확인

1. API 키 목록에서 다음 키 찾기:
   - `AIzaSyCz-ZPlMtzFjkXvGuV0HP22sWupJp7uL_4` ⚠️ 노출됨

### Step 3: 기존 키 삭제

1. 키 옆 **삭제 아이콘** 클릭
2. 확인

### Step 4: 새 API 키 생성

1. **Create API Key** 버튼 클릭
2. 프로젝트 선택
3. **Create API key in new project** 또는 기존 프로젝트 선택
4. 새 키가 생성됨
5. **키 복사** (예: `AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`)

**⚠️ 중요:** 키는 한 번만 표시됩니다. 복사하세요!

### Step 5: Vercel 환경 변수 업데이트

1. Vercel Dashboard > **Settings** > **Environment Variables**
2. `GEMINI_API_KEY` 변수 찾기
3. 변수 클릭 > **Edit**
4. 새 키 값 입력
5. **Save** 클릭

### Step 6: 로컬 .env 파일 업데이트

```env
GEMINI_API_KEY=새로운_gemini_api_key
```

### Step 7: 애플리케이션 재배포

Vercel에서 재배포 실행

---

## 6️⃣ 최종 확인 및 테스트

### Step 1: 모든 환경 변수 확인

Vercel Dashboard에서 다음 변수들이 모두 업데이트되었는지 확인:

- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` ✅
- [ ] `GEMINI_API_KEY` ✅
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` ✅
- [ ] `SUPABASE_SERVICE_ROLE_KEY` ✅
- [ ] `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` (변경 없음)
- [ ] `CLOUDINARY_API_KEY` (변경 없음)
- [ ] `CLOUDINARY_API_SECRET` ✅
- [ ] `JWT_SECRET` ✅

### Step 2: 로컬 .env 파일 확인

프로젝트 루트의 `.env` 파일이 모두 업데이트되었는지 확인:

```env
# Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=새로운_키

# Gemini API
GEMINI_API_KEY=새로운_키

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://heytensiqyzqscptkcym.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=새로운_키
SUPABASE_SERVICE_ROLE_KEY=새로운_키

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dwcx3cxxd
CLOUDINARY_API_KEY=889538896366331
CLOUDINARY_API_SECRET=새로운_키

# JWT
JWT_SECRET=새로운_키
```

### Step 3: 프로덕션 테스트

배포 완료 후 다음 기능 테스트:

1. **홈페이지 로드**
   - [ ] 지도가 정상적으로 표시되는지 확인

2. **회원가입/로그인**
   - [ ] 회원가입 테스트
   - [ ] 로그인 테스트 (JWT Secret 변경으로 재로그인 필요)

3. **러닝 코스 등록**
   - [ ] 지도에서 코스 그리기
   - [ ] 코스 등록

4. **러닝 기록 업로드**
   - [ ] 기록 등록
   - [ ] 이미지 업로드 (Cloudinary)
   - [ ] 칼로리 계산 (Gemini API)

5. **기타 기능**
   - [ ] 좋아요 기능
   - [ ] 댓글 기능

### Step 4: 사용량 모니터링

각 서비스의 사용량 대시보드를 확인하여 정상적인 사용만 있는지 확인:

- [ ] Google Cloud Console - Maps API 사용량
- [ ] Google AI Studio - Gemini API 사용량
- [ ] Supabase Dashboard - API 요청 수
- [ ] Cloudinary Dashboard - 대역폭/저장소 사용량

---

## 7️⃣ Git 히스토리 정리 (선택사항)

### 방법 1: 파일 수정 후 커밋 (이미 완료)

```bash
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"

git add VERCEL_DEPLOYMENT.md PUSH_TO_GITHUB.md
git commit -m "Remove exposed API keys from documentation"
git push origin main
```

**⚠️ 주의:** 이 방법은 Git 히스토리에 여전히 이전 키가 남아있습니다.

### 방법 2: Git 히스토리 완전 제거 (권장)

#### git-filter-repo 사용

```bash
# git-filter-repo 설치 (필요한 경우)
pip install git-filter-repo

# VERCEL_DEPLOYMENT.md 파일의 히스토리에서 키 제거
git filter-repo --path VERCEL_DEPLOYMENT.md --invert-paths

# 또는 특정 키 패턴 제거
git filter-repo --replace-text passwords.txt
```

#### BFG Repo-Cleaner 사용

```bash
# BFG 설치 (Homebrew)
brew install bfg

# .env 파일 히스토리에서 제거
bfg --delete-files .env

# 또는 특정 키 제거
bfg --replace-text passwords.txt
```

**⚠️ 주의:** 이 방법은 Git 히스토리를 재작성하므로 강제 푸시가 필요합니다:

```bash
git push origin main --force
```

**⚠️ 매우 주의:** 강제 푸시는 팀 작업 시 문제를 일으킬 수 있습니다. 혼자 작업하는 경우에만 사용하세요.

---

## 📝 체크리스트

### 교체 완료 확인

- [ ] Supabase Service Role Key 교체 완료
- [ ] Supabase Anon Key 교체 완료
- [ ] Cloudinary API Secret 교체 완료
- [ ] JWT Secret 교체 완료
- [ ] Google Maps API 키 교체 완료
- [ ] Gemini API 키 교체 완료

### 환경 변수 업데이트 확인

- [ ] Vercel 환경 변수 모두 업데이트 완료
- [ ] 로컬 .env 파일 업데이트 완료

### 배포 및 테스트

- [ ] Vercel 재배포 완료
- [ ] 프로덕션 환경 테스트 완료
- [ ] 모든 기능 정상 작동 확인

### 모니터링

- [ ] 각 서비스 사용량 확인
- [ ] 비정상적인 활동 없음 확인

### Git 정리

- [ ] 문서 파일에서 키 제거 완료
- [ ] Git 커밋 및 푸시 완료
- [ ] Git 히스토리 정리 (선택사항)

---

## 🆘 문제 해결

### 문제: Vercel 배포 실패

**원인:** 환경 변수가 올바르게 업데이트되지 않음

**해결:**
1. Vercel Dashboard에서 환경 변수 재확인
2. 모든 환경(Production, Preview, Development)에 적용되었는지 확인
3. 변수 이름에 오타가 없는지 확인
4. 재배포

### 문제: 애플리케이션 작동 안 함

**원인:** 새 키에 제한이 너무 엄격함

**해결:**
1. Google Maps API 키 제한 확인
2. HTTP referrer 설정 확인
3. Vercel 도메인이 허용 목록에 있는지 확인

### 문제: 사용자 로그인 안 됨

**원인:** JWT Secret 변경으로 모든 세션 무효화

**해결:**
1. 사용자에게 재로그인 요청
2. 쿠키 삭제 후 재시도

---

## 📚 추가 리소스

- [Supabase API 키 관리](https://supabase.com/docs/guides/platform/api-keys)
- [Cloudinary 보안 가이드](https://cloudinary.com/documentation/security)
- [Google Cloud API 키 보안](https://cloud.google.com/docs/authentication/api-keys)
- [Vercel 환경 변수 가이드](https://vercel.com/docs/concepts/projects/environment-variables)

---

## 요약

1. ✅ **우선순위 순서로 키 교체**
2. ✅ **Vercel 환경 변수 업데이트**
3. ✅ **로컬 .env 파일 업데이트**
4. ✅ **애플리케이션 재배포**
5. ✅ **프로덕션 테스트**
6. ✅ **사용량 모니터링**
7. ✅ **Git 히스토리 정리**

**모든 키 교체가 완료되면 안전합니다!**

---

## ⚠️ 중요 사항

1. **키는 한 번만 표시됩니다.** 복사하세요!
2. **JWT Secret 변경 시 모든 사용자 재로그인 필요**
3. **Service Role Key와 API Secret은 절대 공개하지 마세요**
4. **정기적으로 키를 교체하세요 (3-6개월)**
5. **키 교체 후 반드시 테스트하세요**

**보안은 지속적인 과정입니다. 정기적으로 확인하세요!**
