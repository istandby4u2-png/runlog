# Cloudinary 이미지 업로드 디버깅 가이드

## 🔍 현재 상황
- ✅ 이미지 압축 작동
- ✅ 환경 변수 입력 완료
- ✅ 재배포 완료
- ❌ 이미지 표시 안 됨

---

## 📋 체크리스트

### 1. Cloudinary 계정 상태 확인

1. **Cloudinary 대시보드** 접속
   - 🔗 https://console.cloudinary.com/

2. **상단에 경고 메시지가 있나요?**
   - "Please verify your email"
   - "Account suspended"
   - 기타 경고

3. **이메일 인증 완료했나요?**
   - Cloudinary 가입 시 받은 인증 메일 확인
   - 인증 링크 클릭

4. **Media Library에서 직접 업로드 테스트:**
   - 좌측 메뉴 → **Media Library**
   - **Upload** 버튼 클릭
   - 이미지 업로드 시도
   - ✅ 성공 → 계정은 정상
   - ❌ 실패 → 계정 문제

---

### 2. Vercel 환경 변수 재확인

**Vercel Settings → Environment Variables에서:**

#### ✅ 올바른 설정:

**변수 1:**
```
Name: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
Value: dwcx3cxxd (예시 - 본인의 값)
Environments: ✅ Production ✅ Preview ✅ Development
```

**변수 2:**
```
Name: CLOUDINARY_API_KEY
Value: 123456789012345 (예시 - 본인의 값)
Environments: ✅ Production ✅ Preview ✅ Development
```

**변수 3:**
```
Name: CLOUDINARY_API_SECRET
Value: abcdefgh12345678 (예시 - 본인의 값)
Environments: ✅ Production ✅ Preview ✅ Development
```

#### ❌ 흔한 실수:

1. **이름 오타:**
   - ❌ `CLOUDINARY_CLOUD_NAME` (NEXT_PUBLIC_ 없음)
   - ❌ `NEXT_PUBLIC_CLOUDINARY_API_KEY` (불필요한 NEXT_PUBLIC_)
   - ❌ `CLOUDINARY-API-KEY` (언더스코어 대신 하이픈)

2. **환경 미선택:**
   - Production만 체크 (Preview, Development 미체크)

3. **값 오류:**
   - 앞뒤 공백 포함
   - API Secret을 Show하지 않고 복사

---

### 3. Vercel 로그 확인 (가장 중요!)

**단계:**

1. **Vercel 대시보드** → **Logs** 탭

2. **필터 설정:**
   - Source: **Functions**
   - Time: **Last 1 hour**

3. **이미지 업로드 시도**

4. **로그 검색:**
   - 검색창에 `Cloudinary` 입력

5. **찾을 내용:**

#### 시나리오 A: 환경 변수 미로드
```
🔍 Cloudinary 환경 변수 확인:
   - NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: ❌ 없음
   - CLOUDINARY_API_KEY: ❌ 없음
   - CLOUDINARY_API_SECRET: ❌ 없음
❌ Cloudinary 환경 변수가 설정되지 않았습니다.
```
**해결:** 환경 변수 이름 확인, 재배포

#### 시나리오 B: 인증 실패
```
❌ Cloudinary 업로드 실패: Unauthorized
❌ HTTP 코드: 401
❌ Cloudinary 인증 오류: API 키 또는 시크릿이 잘못되었습니다.
```
**해결:** API Key, Secret 재확인 및 재입력

#### 시나리오 C: Cloudinary 서버 오류
```
❌ Cloudinary 업로드 실패: ...
❌ HTTP 코드: 500
```
**해결:** Cloudinary 계정 상태 확인, API 키 재생성

#### 시나리오 D: 업로드 성공
```
✅ Cloudinary 업로드 성공: https://res.cloudinary.com/dwcx3cxxd/image/upload/v1234567890/runlog/records/abc123.jpg
```
**해결:** 업로드는 성공, DB 저장 문제 확인

---

### 4. 브라우저 Network 탭 확인

**단계:**

1. **F12 (개발자 도구)**
2. **Network 탭**
3. **이미지 업로드 후 저장**
4. **`/api/records` 또는 `/api/courses` 요청 클릭**
5. **Response 확인**

#### ✅ 성공:
```json
{
  "message": "기록이 등록되었습니다.",
  "recordId": 123
}
```

#### ❌ 실패:
```json
{
  "error": "서버 오류가 발생했습니다.",
  "details": "..."
}
```

---

## 🔧 문제별 해결 방법

### 문제 1: 환경 변수가 로드되지 않음

**로그:**
```
❌ 없음
```

**해결:**
1. Vercel Environment Variables에서 이름 재확인
2. Production 환경에 체크했는지 확인
3. 재배포 (Redeploy)
4. 5-10분 대기 후 재시도

---

### 문제 2: 401/403 인증 오류

**로그:**
```
❌ HTTP 코드: 401
```

**해결:**
1. **Cloudinary 대시보드** → **Settings** → **Security**
2. **API Key 재생성:**
   - Generate New API Key 클릭
   - 새 API Key와 Secret 복사
3. **Vercel Environment Variables 업데이트:**
   - 기존 변수 삭제
   - 새 값으로 재생성
4. **재배포**

---

### 문제 3: 500 서버 오류

**로그:**
```
❌ HTTP 코드: 500
```

**가능한 원인:**
1. Cloudinary 계정 비활성화
2. Cloud Name이 잘못됨
3. Cloudinary 서비스 장애

**해결:**
1. **Cloudinary Media Library에서 직접 업로드 테스트**
2. **Cloudinary 대시보드에서 경고 메시지 확인**
3. **이메일 인증 완료**
4. **Cloud Name 재확인** (대소문자 구분)

---

### 문제 4: 업로드는 성공했지만 이미지 표시 안 됨

**로그:**
```
✅ Cloudinary 업로드 성공: https://res.cloudinary.com/...
```

**원인:** 이미지 URL이 DB에 저장되지 않음

**확인 방법:**
1. **브라우저에서 업로드된 이미지 URL 직접 접속**
   - 로그에서 URL 복사
   - 브라우저 새 탭에서 열기
   - ✅ 이미지 보임 → Cloudinary 정상
   - ❌ 404 → Cloudinary 문제

2. **Database 확인 필요**

---

## 🎯 지금 확인해야 할 것

### 우선순위 1: Vercel 로그
가장 정확한 오류 원인을 알 수 있습니다.

**경로:**
Vercel Dashboard → Logs → Functions → 최신 로그

**검색어:** `Cloudinary`

**확인 항목:**
- 환경 변수 로드 상태
- 업로드 시작 로그
- 성공/실패 메시지
- 오류 코드 (401, 403, 500)

---

### 우선순위 2: Cloudinary 계정
Media Library에서 직접 업로드가 되는지 확인

**경로:**
Cloudinary Dashboard → Media Library → Upload

---

### 우선순위 3: 환경 변수 이름
대소문자, 언더스코어, 접두사 정확히 확인

---

## 📞 다음 단계

**Vercel 로그에서 찾은 메시지를 알려주세요:**

1. `🔍 Cloudinary 환경 변수 확인:` 부분의 전체 내용
2. `❌ Cloudinary 업로드 실패:` 메시지 (있다면)
3. HTTP 코드 (401, 403, 500 등)

그러면 정확한 해결 방법을 알려드릴 수 있습니다!

---

## 💡 참고

현재 코드는 Cloudinary 업로드 과정을 매우 상세하게 로깅하도록 되어 있습니다.
Vercel 로그만 확인하면 정확한 원인을 알 수 있습니다! 🎯
