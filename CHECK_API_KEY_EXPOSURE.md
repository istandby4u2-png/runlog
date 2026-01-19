# 🔍 API 키 노출 확인 및 악용 감지 가이드

## 현재 상태 확인

### ✅ 안전한 부분

1. **`.env` 파일은 Git에 추적되지 않음**
   - `.gitignore`에 포함되어 있음
   - 실제 API 키는 로컬 `.env` 파일에만 존재

2. **코드에 하드코딩된 키 없음**
   - 모든 키는 `process.env`로 참조
   - 환경 변수로만 관리

### ⚠️ 확인 필요한 부분

1. **문서 파일에 예시 키가 있을 수 있음**
   - `.md` 파일들에 예시로 작성된 키
   - 실제 키와 유사한 형식

2. **Git 히스토리에 이전 커밋이 있을 수 있음**
   - 과거에 실수로 커밋했을 가능성

---

## 🔍 API 키 노출 확인 방법

### 1. GitHub 저장소에서 직접 확인

#### 방법 1: GitHub 웹에서 검색

1. [GitHub 저장소](https://github.com/istandby4u2-png/runlog) 접속
2. **Code** 탭 클릭
3. 검색창에서 다음 패턴 검색:
   - `AIzaSy` (Google Maps/Gemini API 키)
   - `sb_` (Supabase API 키)
   - `CLOUDINARY_API`
   - `JWT_SECRET`
   - `Tybzsd198Z9AAJ9D7fPMt7c7e9dwaZWUtsUCM5GrWuI` (JWT Secret 예시)

#### 방법 2: GitHub Security 탭 확인

1. 저장소 > **Security** 탭
2. **Secret scanning** 확인
   - GitHub가 자동으로 노출된 키를 감지
   - 알림이 있으면 즉시 조치

### 2. 로컬에서 Git 히스토리 확인

```bash
# Google Maps/Gemini API 키 검색
git log --all --full-history -p | grep -i "AIzaSy"

# Supabase API 키 검색
git log --all --full-history -p | grep -i "sb_"

# Cloudinary API 키 검색
git log --all --full-history -p | grep -i "CLOUDINARY"

# JWT Secret 검색
git log --all --full-history -p | grep -i "JWT_SECRET"

# 모든 환경 변수 검색
git log --all --full-history -p | grep -E "API.*KEY|SECRET|PASSWORD|TOKEN"
```

### 3. 현재 파일에서 검색

```bash
# 현재 작업 디렉토리에서 실제 키 패턴 검색
grep -r "AIzaSy[A-Za-z0-9_-]\{35\}" . --exclude-dir=node_modules --exclude-dir=.git
grep -r "sb_[A-Za-z0-9_-]\{20,\}" . --exclude-dir=node_modules --exclude-dir=.git
```

---

## 🚨 API 키 악용 확인 방법

### 1. Google Maps API 사용량 확인

#### Google Cloud Console에서 확인

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 프로젝트 선택
3. **APIs & Services > Dashboard** 이동
4. **Maps JavaScript API** 클릭
5. **Metrics** 탭 확인:
   - **Requests per day**: 일일 요청 수
   - **Requests per minute**: 분당 요청 수
   - 비정상적인 급증 확인

#### 사용량 제한 확인

1. **APIs & Services > Quotas** 이동
2. Maps JavaScript API 할당량 확인
3. 비정상적인 사용량 패턴 확인:
   - 예상보다 많은 요청
   - 알 수 없는 IP에서의 요청
   - 비정상적인 시간대의 요청

#### API 키 사용 내역 확인

1. **APIs & Services > Credentials** 이동
2. API 키 클릭
3. **Usage** 탭 확인:
   - 최근 사용 내역
   - 요청 IP 주소
   - 요청 시간

### 2. Supabase 사용량 확인

#### Supabase Dashboard에서 확인

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택
3. **Settings > Usage** 이동
4. 확인 항목:
   - **Database Size**: 데이터베이스 크기
   - **API Requests**: API 요청 수
   - **Bandwidth**: 대역폭 사용량
   - **Storage**: 저장소 사용량

#### 비정상적인 활동 확인

1. **Logs** 탭 확인:
   - 최근 API 요청 로그
   - 비정상적인 쿼리 패턴
   - 알 수 없는 IP에서의 요청

2. **Database > Logs** 확인:
   - SQL 쿼리 로그
   - 비정상적인 접근 시도

### 3. Cloudinary 사용량 확인

#### Cloudinary Dashboard에서 확인

1. [Cloudinary Dashboard](https://cloudinary.com/console) 접속
2. **Usage** 탭 확인:
   - **Bandwidth**: 대역폭 사용량
   - **Storage**: 저장소 사용량
   - **Transformations**: 이미지 변환 횟수
   - **Requests**: API 요청 수

#### 비정상적인 활동 확인

1. **Activity** 탭 확인:
   - 최근 업로드/삭제 활동
   - 알 수 없는 이미지 업로드
   - 비정상적인 대역폭 사용

2. **Media Library** 확인:
   - 예상하지 못한 이미지 파일
   - 알 수 없는 폴더 구조

### 4. Gemini API 사용량 확인

#### Google AI Studio에서 확인

1. [Google AI Studio](https://makersuite.google.com/app/apikey) 접속
2. API 키 선택
3. 사용량 확인:
   - **Requests**: 요청 수
   - **Tokens**: 사용된 토큰 수
   - **Cost**: 비용

#### Google Cloud Console에서 확인

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. **APIs & Services > Dashboard** 이동
3. **Generative Language API** 확인
4. **Metrics** 탭에서 사용량 확인

---

## 🛡️ 악용 징후 확인 체크리스트

### Google Maps API

- [ ] 일일 요청 수가 예상보다 많음
- [ ] 알 수 없는 IP에서의 요청
- [ ] 비정상적인 시간대의 요청 (예: 새벽 시간대)
- [ ] 할당량이 예상보다 빠르게 소진됨
- [ ] 비용이 예상보다 높음

### Supabase

- [ ] 데이터베이스 크기가 급격히 증가
- [ ] API 요청 수가 예상보다 많음
- [ ] 알 수 없는 IP에서의 접근
- [ ] 비정상적인 쿼리 패턴
- [ ] 저장소 사용량이 급격히 증가

### Cloudinary

- [ ] 대역폭 사용량이 예상보다 많음
- [ ] 알 수 없는 이미지 파일 업로드
- [ ] 저장소 사용량이 급격히 증가
- [ ] 비정상적인 이미지 변환 요청

### Gemini API

- [ ] 요청 수가 예상보다 많음
- [ ] 토큰 사용량이 급격히 증가
- [ ] 비용이 예상보다 높음

---

## 🚨 악용이 확인된 경우 즉시 조치

### 1. 즉시 API 키 무효화

1. **Google Maps API**: Google Cloud Console에서 키 삭제
2. **Supabase**: Dashboard에서 키 재생성
3. **Cloudinary**: Dashboard에서 키 재생성
4. **Gemini API**: Google AI Studio에서 키 삭제

### 2. 새 키 발급 및 교체

1. 새 API 키 발급
2. Vercel 환경 변수 업데이트
3. 애플리케이션 재배포

### 3. 사용량 제한 설정

1. **Google Maps API**: 
   - API restrictions 설정
   - Application restrictions 설정
   - 할당량 제한 설정

2. **Supabase**:
   - Row Level Security (RLS) 정책 확인
   - API rate limiting 설정

3. **Cloudinary**:
   - 업로드 제한 설정
   - 대역폭 제한 설정

---

## 📊 정기적인 모니터링

### 주간 확인 사항

- [ ] 각 서비스의 사용량 확인
- [ ] 비용 확인
- [ ] 비정상적인 활동 확인

### 월간 확인 사항

- [ ] 사용량 트렌드 분석
- [ ] 비용 분석
- [ ] 보안 로그 검토

---

## 🔐 예방 조치

### 1. API 키 제한 설정

- **Google Maps API**: HTTP referrer 제한
- **Supabase**: RLS 정책 강화
- **Cloudinary**: 업로드 제한 설정

### 2. 모니터링 알림 설정

- **Google Cloud**: 사용량 알림 설정
- **Supabase**: 사용량 알림 설정
- **Cloudinary**: 사용량 알림 설정

### 3. 정기적인 키 교체

- 3-6개월마다 API 키 교체
- 보안 이벤트 발생 시 즉시 교체

---

## 요약

1. ✅ **현재 상태**: `.env` 파일은 Git에 추적되지 않음 (안전)
2. ⚠️ **확인 필요**: 문서 파일과 Git 히스토리 확인
3. 🔍 **악용 확인**: 각 서비스의 사용량 대시보드 확인
4. 🛡️ **예방 조치**: API 키 제한 설정 및 모니터링

**정기적으로 사용량을 확인하고, 비정상적인 활동이 발견되면 즉시 조치하세요!**
