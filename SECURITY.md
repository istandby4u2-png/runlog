# 보안 가이드

## ⚠️ 중요: API 키 보안

### 현재 상황
API 키가 코드에 포함되어 있습니다. 다음 보안 조치를 취하세요:

### 1. Google Cloud Console에서 API 키 제한 설정

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. **API 및 서비스** > **사용자 인증 정보** 선택
3. API 키 클릭하여 편집

#### 애플리케이션 제한사항 설정:
- **HTTP 리퍼러(웹사이트)** 선택
- 다음 패턴 추가:
  ```
  http://localhost:3000/*
  https://yourdomain.com/*
  ```

#### API 제한사항 설정:
- **API 키 제한** 선택
- **Maps JavaScript API**만 선택

### 2. Git에 API 키가 노출된 경우

만약 API 키가 Git에 커밋되었다면:

1. **즉시 API 키 무효화**:
   - Google Cloud Console에서 해당 API 키 삭제
   - 새 API 키 생성

2. **Git 히스토리에서 제거** (고급):
   ```bash
   # 주의: 이 작업은 Git 히스토리를 수정합니다
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch .env" \
     --prune-empty --tag-name-filter cat -- --all
   ```

3. **새 API 키로 교체**:
   - `.env` 파일에 새 API 키 설정

### 3. 프로덕션 환경 설정

프로덕션 환경에서는:

1. **환경 변수로 관리**:
   - Vercel, Netlify 등 호스팅 서비스의 환경 변수 설정 사용
   - 절대 코드에 하드코딩하지 않기

2. **JWT_SECRET 변경**:
   - 강력한 랜덤 문자열 생성
   - 예: `openssl rand -base64 32`

3. **API 키 모니터링**:
   - Google Cloud Console에서 사용량 모니터링
   - 비정상적인 사용량 감지 시 즉시 대응

### 4. .env 파일 보안

- ✅ `.env` 파일은 `.gitignore`에 포함되어 있음
- ✅ 절대 Git에 커밋하지 않기
- ✅ 공유하지 않기
- ✅ 프로덕션에서는 환경 변수로 관리

### 5. 추가 보안 권장사항

1. **정기적인 API 키 로테이션**
2. **사용량 알림 설정**
3. **IP 제한** (서버 사이드 API 사용 시)
4. **쿼터 제한 설정**

## 현재 API 키 상태

- ✅ `.env` 파일에 설정됨
- ✅ `.gitignore`에 포함됨
- ⚠️ Google Cloud Console에서 제한 설정 필요
