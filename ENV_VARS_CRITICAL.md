# 환경 변수 설정 (중요!)

## 현재 상황

- 로그인, 코스 등록, 기록 등록 모두 서버 오류 발생
- 원인: Vercel 환경 변수가 설정되지 않음

---

## 해결 방법: Vercel 환경 변수 설정

### Step 1: Vercel 프로젝트 선택

1. **Vercel 대시보드 접속**
   - https://vercel.com/dashboard
   - 로그인

2. **프로젝트 선택**
   - `runlog` 프로젝트 클릭

---

### Step 2: 환경 변수 설정 페이지 접속

1. **Settings 메뉴 클릭**
   - 프로젝트 페이지에서 "Settings" 탭 클릭

2. **Environment Variables 메뉴 클릭**
   - 왼쪽 사이드바에서 "Environment Variables" 클릭

---

### Step 3: 필수 환경 변수 추가

다음 9개의 환경 변수를 **하나씩** 추가하세요:

#### 1. Supabase URL
- **Key:** `NEXT_PUBLIC_SUPABASE_URL`
- **Value:** Supabase 대시보드 > Settings > API > Project URL
- **Environment:** ✅ Production, ✅ Preview, ✅ Development

#### 2. Supabase Anon Key
- **Key:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value:** Supabase 대시보드 > Settings > API > anon public key
- **Environment:** ✅ Production, ✅ Preview, ✅ Development

#### 3. Supabase Service Role Key ⚠️ **가장 중요!**
- **Key:** `SUPABASE_SERVICE_ROLE_KEY`
- **Value:** Supabase 대시보드 > Settings > API > service_role secret key
- **Environment:** ✅ Production, ✅ Preview, ✅ Development

#### 4. JWT Secret
- **Key:** `JWT_SECRET`
- **Value:** 로컬 `.env` 파일의 `JWT_SECRET` 값
- **Environment:** ✅ Production, ✅ Preview, ✅ Development

#### 5. Google Maps API Key
- **Key:** `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- **Value:** Google Maps API 키
- **Environment:** ✅ Production, ✅ Preview, ✅ Development

#### 6. Gemini API Key
- **Key:** `GEMINI_API_KEY`
- **Value:** Google Gemini API 키
- **Environment:** ✅ Production, ✅ Preview, ✅ Development

#### 7. Cloudinary Cloud Name
- **Key:** `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- **Value:** Cloudinary Dashboard > Settings > Cloud name
- **Environment:** ✅ Production, ✅ Preview, ✅ Development

#### 8. Cloudinary API Key
- **Key:** `CLOUDINARY_API_KEY`
- **Value:** Cloudinary Dashboard > Settings > API Key
- **Environment:** ✅ Production, ✅ Preview, ✅ Development

#### 9. Cloudinary API Secret
- **Key:** `CLOUDINARY_API_SECRET`
- **Value:** Cloudinary Dashboard > Settings > API Secret
- **Environment:** ✅ Production, ✅ Preview, ✅ Development

---

## 환경 변수 값 확인 방법

### Supabase 값 확인

1. **Supabase 대시보드 접속**
   - https://supabase.com/dashboard
   - 프로젝트 선택

2. **Settings > API 메뉴 클릭**
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **중요!**

### Cloudinary 값 확인

1. **Cloudinary 대시보드 접속**
   - https://cloudinary.com/console
   - 로그인

2. **Settings 메뉴 클릭**
   - **Cloud name** → `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
   - **API Key** → `CLOUDINARY_API_KEY`
   - **API Secret** → `CLOUDINARY_API_SECRET`

### 로컬 .env 파일에서 확인

로컬 프로젝트의 `.env` 파일에서 다음 값들을 복사:

- `JWT_SECRET`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `GEMINI_API_KEY`

---

## 환경 변수 추가 방법 (상세)

각 환경 변수를 추가할 때:

1. **"Add New" 또는 "+" 버튼 클릭**

2. **Key 입력**
   - 예: `SUPABASE_SERVICE_ROLE_KEY`

3. **Value 입력**
   - Supabase 대시보드에서 복사한 값 붙여넣기
   - **주의:** 공백이나 따옴표가 포함되지 않도록 주의

4. **Environment 선택**
   - ✅ Production
   - ✅ Preview
   - ✅ Development
   - (모두 체크하는 것을 권장)

5. **"Save" 버튼 클릭**

6. **다음 환경 변수 추가**
   - "Add New" 버튼을 다시 클릭하여 다음 변수 추가

---

## 빠른 체크리스트

다음 환경 변수가 모두 추가되었는지 확인:

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **가장 중요!**
- [ ] `JWT_SECRET`
- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- [ ] `GEMINI_API_KEY`
- [ ] `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- [ ] `CLOUDINARY_API_KEY`
- [ ] `CLOUDINARY_API_SECRET`

**중요:** 각 변수의 **Production** 체크박스가 체크되어 있어야 합니다!

---

## 환경 변수 추가 후

### Step 1: 재배포

환경 변수를 추가한 후:

1. **자동 재배포 대기**
   - Vercel이 자동으로 재배포를 시작할 수 있습니다

2. **또는 수동 재배포**
   - Deployments > 최근 배포 > "..." 메뉴 > "Redeploy"

### Step 2: 테스트

1. **프로덕션 URL에서 테스트**
   - 로그인 시도
   - 코스 등록 시도
   - 기록 등록 시도

2. **브라우저 개발자 도구에서 오류 확인**
   - `F12` > Network 탭
   - 각 API 요청의 Response 확인

---

## 문제 해결

### 문제 1: 여전히 "서버 설정 오류가 발생했습니다."

**확인사항:**
1. `SUPABASE_SERVICE_ROLE_KEY`가 올바른지 확인
2. Production 환경에 체크되어 있는지 확인
3. 값에 공백이나 따옴표가 포함되지 않았는지 확인
4. 재배포가 완료되었는지 확인

### 문제 2: 환경 변수가 적용되지 않음

**해결:**
1. 환경 변수 추가 후 재배포 확인
2. Production 환경에 체크되어 있는지 확인
3. Vercel 대시보드에서 환경 변수 목록 확인

---

## 다음 단계

1. ✅ Vercel 프로젝트 선택
2. ✅ Settings > Environment Variables 접속
3. ⏭️ 모든 환경 변수 추가 (9개)
4. ⏭️ 재배포 대기
5. ⏭️ 프로덕션에서 테스트

**환경 변수를 모두 추가한 후, 재배포를 기다리고 프로덕션에서 다시 시도해보세요!**

---

## 중요 사항

- **`SUPABASE_SERVICE_ROLE_KEY`는 가장 중요합니다!** 이 변수가 없으면 모든 API가 실패합니다.
- 모든 환경 변수는 **Production 환경에 체크**되어 있어야 합니다.
- 환경 변수 추가 후 **재배포**가 필요합니다.
