# 📝 환경 변수 업데이트 및 재배포 상세 가이드

## 목차

1. [Vercel 환경 변수 업데이트](#1-vercel-환경-변수-업데이트)
2. [로컬 .env 파일 업데이트](#2-로컬-env-파일-업데이트)
3. [재배포](#3-재배포)

---

## 1. Vercel 환경 변수 업데이트

### Step 1: Vercel Dashboard 접속

1. 웹 브라우저에서 [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. 로그인 (GitHub 계정으로 로그인)
3. 프로젝트 목록에서 **runlog** 프로젝트 클릭

### Step 2: Settings 메뉴 접근

1. 프로젝트 페이지 상단의 탭 메뉴에서 **Settings** 클릭
2. 왼쪽 사이드바에서 **Environment Variables** 클릭

### Step 3: 기존 환경 변수 확인

현재 설정된 환경 변수 목록이 표시됩니다. 다음 변수들을 찾아야 합니다:

- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- `GEMINI_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `JWT_SECRET`

### Step 4: 각 환경 변수 업데이트

#### 방법 1: 기존 변수 수정 (권장)

각 변수를 하나씩 업데이트합니다:

1. **변수 찾기**
   - 목록에서 업데이트할 변수 찾기
   - 예: `SUPABASE_SERVICE_ROLE_KEY`

2. **변수 클릭**
   - 변수 이름 또는 값 영역 클릭
   - 또는 변수 오른쪽의 **"..."** 메뉴 클릭 > **Edit** 선택

3. **값 수정**
   - **Value** 필드에 새 키 값 입력
   - 예: `sb_secret_새로운키값`
   
   **⚠️ 주의:**
   - 공백이나 줄바꿈이 없어야 합니다
   - 따옴표는 입력하지 마세요
   - 전체 키 값을 정확히 복사하세요

4. **환경 선택 확인**
   - **Environment** 섹션에서 다음이 모두 체크되어 있는지 확인:
     - ✅ **Production**
     - ✅ **Preview**
     - ✅ **Development**
   
   **⚠️ 중요:** 모든 환경에 적용되어야 합니다!

5. **저장**
   - **Save** 버튼 클릭
   - 또는 **Update** 버튼 클릭

6. **확인**
   - 변수 목록에서 값이 업데이트되었는지 확인
   - 변수 이름 옆에 환경 아이콘이 표시되는지 확인

#### 방법 2: 변수 삭제 후 재생성

기존 변수를 삭제하고 새로 생성할 수도 있습니다:

1. **변수 삭제**
   - 변수 오른쪽의 **"..."** 메뉴 클릭
   - **Delete** 선택
   - 확인 대화상자에서 **Delete** 클릭

2. **새 변수 생성**
   - **Add New** 버튼 클릭
   - **Name** 필드에 변수 이름 입력
   - **Value** 필드에 새 키 값 입력
   - **Environment** 섹션에서 모든 환경 체크
   - **Save** 클릭

### Step 5: 모든 변수 업데이트 확인

다음 변수들이 모두 업데이트되었는지 확인:

- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` = 새로운 Google Maps API 키
- [ ] `GEMINI_API_KEY` = 새로운 Gemini API 키
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` = 새로운 Supabase Anon Key
- [ ] `SUPABASE_SERVICE_ROLE_KEY` = 새로운 Supabase Service Role Key
- [ ] `CLOUDINARY_API_SECRET` = 새로운 Cloudinary API Secret
- [ ] `JWT_SECRET` = 새로운 JWT Secret

**변경하지 않는 변수:**
- `NEXT_PUBLIC_SUPABASE_URL` (변경 없음)
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` (변경 없음)
- `CLOUDINARY_API_KEY` (변경 없음)

### Step 6: 환경 변수 적용 확인

**⚠️ 중요:** Vercel은 환경 변수를 변경해도 **기존 배포에는 자동으로 적용되지 않습니다**. 새 배포를 해야 변경사항이 적용됩니다.

---

## 2. 로컬 .env 파일 업데이트

### Step 1: 프로젝트 루트 디렉토리 확인

터미널에서 프로젝트 루트로 이동:

```bash
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"
```

### Step 2: .env 파일 위치 확인

```bash
ls -la | grep .env
```

**예상 출력:**
```
.env
.env.example (있는 경우)
```

### Step 3: .env 파일 열기

#### 방법 1: 텍스트 에디터 사용 (권장)

**VS Code 사용:**
```bash
code .env
```

**nano 사용:**
```bash
nano .env
```

**vim 사용:**
```bash
vim .env
```

#### 방법 2: Finder에서 열기

1. Finder 열기
2. 프로젝트 폴더로 이동:
   - `~/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서`
3. `.env` 파일 찾기 (숨김 파일이므로 `Cmd + Shift + .`로 표시)
4. 텍스트 에디터로 열기

### Step 4: .env 파일 내용 확인

현재 `.env` 파일 내용 예시:

```env
# Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyCY6pkLokXVXdDEg78KRofqNdG2qWODve8

# Gemini API
GEMINI_API_KEY=AIzaSyCz-ZPlMtzFjkXvGuV0HP22sWupJp7uL_4

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://heytensiqyzqscptkcym.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_7rARXtWTwlJunQ1VfEAZ3w_yWRkVz1X
SUPABASE_SERVICE_ROLE_KEY=sb_secret_1NPYzgAMyWC8IvXNRUH0Kw_HBx4bDEd

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dwcx3cxxd
CLOUDINARY_API_KEY=889538896366331
CLOUDINARY_API_SECRET=cxGoHkFn5FdUxwFzNqGY8qAaTMI

# JWT
JWT_SECRET=Tybzsd198Z9AAJ9D7fPMt7c7e9dwaZWUtsUCM5GrWuI=
```

### Step 5: 각 변수 값 업데이트

각 변수의 값을 새 키로 교체합니다:

#### Google Maps API 키 업데이트

**기존:**
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyCY6pkLokXVXdDEg78KRofqNdG2qWODve8
```

**새로운 값으로 교체:**
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy새로운키값여기에입력
```

**⚠️ 주의:**
- 등호(`=`) 뒤에 공백 없이 바로 값 입력
- 따옴표 없이 입력
- 전체 키 값을 정확히 복사

#### Gemini API 키 업데이트

**기존:**
```env
GEMINI_API_KEY=AIzaSyCz-ZPlMtzFjkXvGuV0HP22sWupJp7uL_4
```

**새로운 값으로 교체:**
```env
GEMINI_API_KEY=AIzaSy새로운키값여기에입력
```

#### Supabase Anon Key 업데이트

**기존:**
```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_7rARXtWTwlJunQ1VfEAZ3w_yWRkVz1X
```

**새로운 값으로 교체:**
```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_새로운키값여기에입력
```

#### Supabase Service Role Key 업데이트

**기존:**
```env
SUPABASE_SERVICE_ROLE_KEY=sb_secret_1NPYzgAMyWC8IvXNRUH0Kw_HBx4bDEd
```

**새로운 값으로 교체:**
```env
SUPABASE_SERVICE_ROLE_KEY=sb_secret_새로운키값여기에입력
```

#### Cloudinary API Secret 업데이트

**기존:**
```env
CLOUDINARY_API_SECRET=cxGoHkFn5FdUxwFzNqGY8qAaTMI
```

**새로운 값으로 교체:**
```env
CLOUDINARY_API_SECRET=새로운시크릿값여기에입력
```

#### JWT Secret 업데이트

**기존:**
```env
JWT_SECRET=Tybzsd198Z9AAJ9D7fPMt7c7e9dwaZWUtsUCM5GrWuI=
```

**새로운 값으로 교체:**
```env
JWT_SECRET=새로운JWT시크릿값여기에입력
```

### Step 6: 최종 .env 파일 확인

업데이트 후 `.env` 파일 예시:

```env
# Google Maps API
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy새로운GoogleMaps키

# Gemini API
GEMINI_API_KEY=AIzaSy새로운Gemini키

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://heytensiqyzqscptkcym.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_새로운Anon키
SUPABASE_SERVICE_ROLE_KEY=sb_secret_새로운ServiceRole키

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dwcx3cxxd
CLOUDINARY_API_KEY=889538896366331
CLOUDINARY_API_SECRET=새로운CloudinarySecret

# JWT
JWT_SECRET=새로운JWTSecret값
```

### Step 7: 파일 저장

- **VS Code**: `Cmd + S` (Mac) 또는 `Ctrl + S` (Windows)
- **nano**: `Ctrl + O` (저장) > Enter > `Ctrl + X` (종료)
- **vim**: `Esc` > `:wq` > Enter

### Step 8: .env 파일 확인 (선택사항)

터미널에서 확인:

```bash
# .env 파일이 올바르게 업데이트되었는지 확인
cat .env | grep -E "GOOGLE_MAPS|GEMINI|SUPABASE|CLOUDINARY|JWT"
```

**⚠️ 중요:** `.env` 파일은 절대 Git에 커밋하지 마세요! `.gitignore`에 포함되어 있는지 확인:

```bash
cat .gitignore | grep .env
```

**예상 출력:**
```
.env*.local
.env
```

---

## 3. 재배포

### 방법 1: Vercel Dashboard에서 재배포 (권장)

#### Step 1: Vercel Dashboard 접속

1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. 프로젝트 선택

#### Step 2: Deployments 탭 이동

1. 상단 탭 메뉴에서 **Deployments** 클릭
2. 배포 목록이 표시됩니다

#### Step 3: 재배포 실행

**옵션 A: 최신 배포 재배포**

1. 최신 배포 항목 찾기 (목록 맨 위)
2. 배포 항목 오른쪽의 **"..."** 메뉴 클릭
3. **Redeploy** 선택
4. 확인 대화상자에서 **Redeploy** 클릭

**옵션 B: 특정 배포 재배포**

1. 재배포할 배포 항목 찾기
2. 배포 항목 클릭하여 상세 페이지로 이동
3. 오른쪽 상단의 **"..."** 메뉴 클릭
4. **Redeploy** 선택
5. 확인 대화상자에서 **Redeploy** 클릭

#### Step 4: 배포 진행 상황 확인

1. 배포 목록에서 재배포 항목 확인
2. 배포 상태 표시:
   - **Building...** - 빌드 중
   - **Ready** - 배포 완료
   - **Error** - 배포 실패

3. 배포 항목 클릭하여 상세 로그 확인:
   - **Build Logs** 탭에서 빌드 로그 확인
   - 오류가 있으면 로그에서 확인

#### Step 5: 배포 완료 확인

1. 배포 상태가 **Ready**가 되면 완료
2. 배포 URL 확인:
   - 예: `https://runlog-xxxxx.vercel.app`
3. URL 클릭하여 사이트 접속 확인

### 방법 2: Git Push로 자동 재배포

#### Step 1: 변경사항 커밋 (선택사항)

환경 변수만 변경한 경우 커밋할 필요는 없지만, 다른 변경사항이 있다면:

```bash
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"

# 변경사항 확인
git status

# 변경사항 추가 (필요한 경우)
git add .

# 커밋
git commit -m "Update environment variables"

# 푸시
git push origin main
```

#### Step 2: 자동 배포 확인

1. Vercel은 GitHub에 푸시되면 자동으로 배포를 시작합니다
2. Vercel Dashboard > **Deployments** 탭에서 새 배포 확인
3. 배포 진행 상황 모니터링

### 방법 3: Vercel CLI로 재배포

#### Step 1: Vercel CLI 설치 (없는 경우)

```bash
npm install -g vercel
```

#### Step 2: Vercel 로그인

```bash
vercel login
```

브라우저가 열리면 로그인

#### Step 3: 프로젝트 디렉토리로 이동

```bash
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"
```

#### Step 4: 배포 실행

```bash
vercel --prod
```

**옵션:**
- `--prod`: 프로덕션 환경에 배포
- `--yes`: 확인 없이 배포

#### Step 5: 배포 확인

터미널에 배포 URL이 표시됩니다.

---

## 4. 배포 후 확인

### Step 1: 사이트 접속 확인

1. Vercel Dashboard에서 배포 URL 확인
2. 브라우저에서 URL 접속
3. 사이트가 정상적으로 로드되는지 확인

### Step 2: 기능 테스트

#### 로그인 테스트

1. **로그인 페이지** 접속
2. 기존 계정으로 로그인 시도
   - **⚠️ JWT Secret을 변경했다면 모든 세션이 무효화됩니다**
   - 재로그인 필요

#### 지도 기능 테스트

1. **코스 등록 페이지** 접속
2. 지도가 정상적으로 표시되는지 확인
3. Google Maps API 키가 올바르게 작동하는지 확인

#### 이미지 업로드 테스트

1. **기록 등록 페이지** 접속
2. 이미지 업로드 시도
3. Cloudinary가 정상적으로 작동하는지 확인

#### 칼로리 계산 테스트

1. **기록 등록 페이지** 접속
2. 식사 내용 입력
3. 칼로리 자동 계산 확인
4. Gemini API가 정상적으로 작동하는지 확인

### Step 3: 오류 확인

#### 브라우저 콘솔 확인

1. 브라우저에서 `F12` 또는 `Cmd + Option + I` (Mac) / `Ctrl + Shift + I` (Windows)
2. **Console** 탭 확인
3. 오류 메시지 확인

#### Vercel 함수 로그 확인

1. Vercel Dashboard > 프로젝트 선택
2. **Functions** 탭 클릭
3. 최근 함수 실행 로그 확인
4. 오류가 있으면 로그 확인

---

## 5. 문제 해결

### 문제: 배포 실패

**원인 1: 환경 변수 누락**

**해결:**
1. Vercel Dashboard > Settings > Environment Variables 확인
2. 모든 필수 변수가 있는지 확인
3. 변수 이름에 오타가 없는지 확인

**원인 2: 환경 변수 값 오류**

**해결:**
1. 변수 값에 공백이나 특수문자가 없는지 확인
2. 전체 키 값을 정확히 복사했는지 확인
3. 따옴표 없이 입력했는지 확인

**원인 3: 빌드 오류**

**해결:**
1. Vercel Dashboard > Deployments > 배포 클릭
2. **Build Logs** 탭 확인
3. 오류 메시지 확인
4. 로컬에서 `npm run build` 테스트

### 문제: 사이트 작동 안 함

**원인 1: Google Maps API 키 제한**

**해결:**
1. Google Cloud Console > APIs & Services > Credentials
2. API 키 클릭
3. **Application restrictions** 확인
4. Vercel 도메인이 허용 목록에 있는지 확인
5. `*.vercel.app/*` 추가

**원인 2: 환경 변수가 적용되지 않음**

**해결:**
1. Vercel Dashboard에서 환경 변수 재확인
2. 모든 환경(Production, Preview, Development)에 적용되었는지 확인
3. 재배포

**원인 3: JWT Secret 변경으로 세션 무효화**

**해결:**
1. 쿠키 삭제
2. 재로그인

### 문제: 로컬 개발 서버 작동 안 함

**원인: .env 파일 오류**

**해결:**
1. `.env` 파일 확인
2. 변수 이름과 값이 올바른지 확인
3. 등호(`=`) 앞뒤 공백 확인
4. 개발 서버 재시작:
   ```bash
   # 서버 중지 (Ctrl + C)
   # 서버 재시작
   npm run dev
   ```

---

## 6. 체크리스트

### Vercel 환경 변수 업데이트

- [ ] Vercel Dashboard 접속
- [ ] Settings > Environment Variables 이동
- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` 업데이트
- [ ] `GEMINI_API_KEY` 업데이트
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` 업데이트
- [ ] `SUPABASE_SERVICE_ROLE_KEY` 업데이트
- [ ] `CLOUDINARY_API_SECRET` 업데이트
- [ ] `JWT_SECRET` 업데이트
- [ ] 모든 환경(Production, Preview, Development)에 적용 확인

### 로컬 .env 파일 업데이트

- [ ] 프로젝트 루트 디렉토리 확인
- [ ] `.env` 파일 열기
- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` 값 업데이트
- [ ] `GEMINI_API_KEY` 값 업데이트
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` 값 업데이트
- [ ] `SUPABASE_SERVICE_ROLE_KEY` 값 업데이트
- [ ] `CLOUDINARY_API_SECRET` 값 업데이트
- [ ] `JWT_SECRET` 값 업데이트
- [ ] 파일 저장
- [ ] `.gitignore`에 `.env` 포함 확인

### 재배포

- [ ] Vercel Dashboard > Deployments 이동
- [ ] 재배포 실행
- [ ] 배포 진행 상황 확인
- [ ] 배포 완료 확인 (Ready 상태)
- [ ] 배포 URL 접속 확인
- [ ] 사이트 정상 로드 확인

### 배포 후 테스트

- [ ] 홈페이지 로드 확인
- [ ] 로그인 테스트
- [ ] 지도 기능 테스트
- [ ] 이미지 업로드 테스트
- [ ] 칼로리 계산 테스트
- [ ] 브라우저 콘솔 오류 확인
- [ ] Vercel 함수 로그 확인

---

## 요약

### Vercel 환경 변수 업데이트

1. Vercel Dashboard > Settings > Environment Variables
2. 각 변수 클릭 > Edit
3. 새 값 입력
4. 모든 환경 체크 확인
5. Save

### 로컬 .env 파일 업데이트

1. 프로젝트 루트의 `.env` 파일 열기
2. 각 변수 값 교체
3. 파일 저장

### 재배포

1. Vercel Dashboard > Deployments
2. 최신 배포 > "..." 메뉴 > Redeploy
3. 배포 완료 대기
4. 사이트 테스트

**모든 단계를 완료하면 새로운 API 키가 적용됩니다!**

---

## ⚠️ 중요 사항

1. **환경 변수는 즉시 적용되지 않습니다.** 재배포가 필요합니다.
2. **모든 환경(Production, Preview, Development)에 적용해야 합니다.**
3. **변수 값에 공백이나 따옴표를 넣지 마세요.**
4. **JWT Secret 변경 시 모든 사용자 재로그인 필요.**
5. **배포 후 반드시 테스트하세요.**

**문제가 발생하면 Vercel Dashboard의 빌드 로그와 함수 로그를 확인하세요!**
