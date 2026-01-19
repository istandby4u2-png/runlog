# Vercel 배포 완전 가이드

## ✅ 완료된 작업
- [x] GitHub에 코드 푸시 완료
- [x] GitHub 저장소: https://github.com/istandby4u2-png/runlog

---

## 다음 단계: Vercel 배포

### 1단계: Vercel에서 프로젝트 Import

1. **Vercel 대시보드 접속**
   - [vercel.com](https://vercel.com) 로그인

2. **새 프로젝트 생성**
   - "Add New..." 버튼 클릭
   - "Project" 선택

3. **GitHub 저장소 선택**
   - GitHub 저장소 목록에서 `istandby4u2-png/runlog` 선택
   - "Import" 버튼 클릭

---

### 2단계: 프로젝트 설정

Vercel이 자동으로 Next.js를 감지합니다. 다음 설정을 확인하세요:

- **Framework Preset**: Next.js (자동 감지)
- **Root Directory**: `./` (기본값)
- **Build Command**: `npm run build` (기본값)
- **Output Directory**: `.next` (기본값)
- **Install Command**: `npm install` (기본값)

**변경할 필요 없습니다!** 기본값 그대로 진행하세요.

---

### 3단계: 환경 변수 설정 (중요!)

**"Environment Variables"** 섹션에서 다음 변수들을 추가하세요:

#### 추가할 환경 변수 목록

```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
JWT_SECRET
GEMINI_API_KEY
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
```

#### 각 변수에 입력할 값

`.env` 파일의 값과 동일하게 입력하세요:

```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
JWT_SECRET=your_jwt_secret_here
GEMINI_API_KEY=your_gemini_api_key_here
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name_here
CLOUDINARY_API_KEY=your_cloudinary_api_key_here
CLOUDINARY_API_SECRET=your_cloudinary_api_secret_here
```

#### 환경 변수 추가 방법

1. "Environment Variables" 섹션에서 "Add" 버튼 클릭
2. 각 변수 추가:
   - **Name**: 변수 이름 (예: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`)
   - **Value**: 변수 값 (예: `AIzaSyCY6pkLokXVXdDEg78KRofqNdG2qWODve8`)
   - **Environment**: **Production, Preview, Development 모두 체크** ✅

3. "Save" 클릭
4. 모든 변수를 반복하여 추가

**⚠️ 중요:**
- `NEXT_PUBLIC_`로 시작하는 변수는 클라이언트에서도 사용되므로 반드시 추가
- `SUPABASE_SERVICE_ROLE_KEY`와 `CLOUDINARY_API_SECRET`은 **절대 공개하지 마세요**
- 모든 환경(Production, Preview, Development)에 추가

---

### 4단계: 배포 실행

1. **모든 환경 변수 추가 완료 확인**
2. **"Deploy" 버튼 클릭**

배포가 시작되면:
- 빌드 로그가 실시간으로 표시됩니다
- 약 2-5분 소요됩니다

---

### 5단계: 배포 확인

#### 배포 성공 확인

1. **배포 상태 확인**
   - "Ready" 상태가 되면 배포 완료
   - 제공되는 URL 확인 (예: `https://runlog.vercel.app`)

2. **프로덕션 URL 접속**
   - 브라우저에서 제공된 URL 접속
   - 애플리케이션이 정상적으로 로드되는지 확인

#### 배포 실패 시

1. **빌드 로그 확인**
   - 오류 메시지 확인
   - 일반적인 원인:
     - 환경 변수 누락
     - 빌드 오류
     - 패키지 설치 실패

2. **문제 해결**
   - 환경 변수가 모두 추가되었는지 확인
   - 로컬에서 `npm run build` 테스트

---

### 6단계: 프로덕션 테스트

배포가 성공하면 다음을 테스트하세요:

- [ ] 홈페이지 로드 확인
- [ ] 회원가입/로그인 테스트
- [ ] 러닝 코스 등록 테스트
- [ ] 러닝 기록 업로드 테스트
- [ ] 이미지 업로드 테스트 (Cloudinary)
- [ ] 칼로리 계산 테스트 (Gemini API)
- [ ] 좋아요/댓글 기능 테스트

---

## 중요 확인사항

### Supabase 스키마 생성

프로덕션 환경에서도 Supabase 스키마가 필요합니다:

1. **Supabase 대시보드 확인**
   - Table Editor에서 테이블이 있는지 확인
   - 없으면 SQL Editor에서 스키마 생성

### 도메인 설정 (선택사항)

1. **Vercel 프로젝트 설정**
   - Settings > Domains
   - 원하는 도메인 추가 (예: `runlog.com`)

---

## 문제 해결

### 배포 실패: "Build Error"

**확인:**
- 환경 변수가 모두 추가되었는지 확인
- 로컬에서 `npm run build` 테스트

### 배포 실패: "Environment Variable Missing"

**해결:**
- 모든 환경 변수가 추가되었는지 확인
- Production, Preview, Development 모두에 추가되었는지 확인

### 런타임 오류: "Internal Server Error"

**확인:**
- Supabase 스키마가 생성되었는지 확인
- 환경 변수가 올바른지 확인
- Vercel 함수 로그 확인

---

## 체크리스트

- [ ] Vercel에서 GitHub 저장소 Import 완료
- [ ] 프로젝트 설정 확인 완료
- [ ] 모든 환경 변수 추가 완료
- [ ] 배포 실행 완료
- [ ] 배포 성공 확인
- [ ] 프로덕션 URL 접속 확인
- [ ] 프로덕션 환경 테스트 완료

---

## 축하합니다! 🎉

배포가 완료되면 RunLog 애플리케이션이 전 세계 어디서나 접속 가능합니다!

문제가 발생하면 Vercel 대시보드의 빌드 로그를 확인하세요.
