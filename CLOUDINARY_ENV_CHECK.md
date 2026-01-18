# Cloudinary 환경 변수 런타임 확인

## 현재 상황

- ✅ 이미지 없이 기록 등록 성공
- ❌ 이미지 업로드 실패 → `imageUrl`이 `null`로 저장됨
- Status Code 500, HTML 응답 반환

**문제:** Cloudinary 업로드가 실패하지만, 기록은 저장됨 (의도된 동작)

---

## 가장 중요한 확인 사항

### Vercel 함수 로그에서 환경 변수 확인

재배포 후 이미지 업로드를 시도하고, Vercel 함수 로그에서 다음을 확인하세요:

```
🔍 Cloudinary 환경 변수 확인:
   - NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: 설정됨 (dwcx3cxxd)
   - CLOUDINARY_API_KEY: 설정됨 (8895...)
   - CLOUDINARY_API_SECRET: 설정됨 (cxGo...)
```

**만약 `❌ 없음`이 표시되면:**
- 환경 변수가 런타임에 로드되지 않음
- Vercel 환경 변수 재확인 필요

---

## 확인 방법

### Step 1: 재배포

코드 개선 사항을 배포:

```bash
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"

git add lib/cloudinary.ts app/api/records/[id]/route.ts
git commit -m "Improve Cloudinary upload error handling and logging"
git push origin main
```

### Step 2: 이미지 업로드 시도

1. 프로덕션 URL에서 기록 등록 시도
2. 이미지 파일 선택
3. 기록 등록

### Step 3: Vercel 함수 로그 확인

1. **Vercel 대시보드 > Logs**
2. **다음 로그 확인:**

   #### 환경 변수 로그
   ```
   🔍 Cloudinary 환경 변수 확인:
      - NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: 설정됨 (dwcx3cxxd)
      - CLOUDINARY_API_KEY: 설정됨 (8895...)
      - CLOUDINARY_API_SECRET: 설정됨 (cxGo...)
   ```

   **만약 `❌ 없음`이 표시되면:**
   - Vercel 환경 변수가 런타임에 로드되지 않음
   - 재배포 필요 또는 환경 변수 재설정 필요

   #### 업로드 시작 로그
   ```
   📤 Cloudinary 업로드 시작...
   📤 폴더: runlog/records
   📤 파일 크기: 123456 bytes
   📤 Cloud name: dwcx3cxxd
   ```

   #### 오류 로그
   ```
   ❌ Cloudinary 업로드 실패: ...
   ❌ 오류 메시지: ...
   ❌ HTTP 코드: 500
   ```

---

## 가능한 원인

### 원인 1: 환경 변수가 런타임에 로드되지 않음

**확인 방법:**
- Vercel 함수 로그에서 `❌ 없음` 확인

**해결:**
- Vercel 환경 변수 재확인
- Production 환경에 체크 확인
- 재배포

---

### 원인 2: Cloudinary 계정 비활성화

**확인 방법:**
- Cloudinary 대시보드에서 계정 상태 확인
- Media Library에서 직접 업로드 테스트

**해결:**
- 계정 활성화
- 이메일 인증 완료

---

### 원인 3: Cloudinary API 키/시크릿 문제

**확인 방법:**
- Vercel 함수 로그에서 환경 변수 값 확인
- Cloudinary 대시보드에서 값 재확인

**해결:**
- API 키/시크릿 재생성
- Vercel 환경 변수 업데이트

---

## 다음 단계

1. ✅ 코드 개선 완료
2. ⏭️ 재배포
3. ⏭️ 이미지 업로드 시도
4. ⏭️ Vercel 함수 로그에서 환경 변수 확인
5. ⏭️ 결과에 따른 해결

---

## 중요 사항

**가장 중요한 것은 Vercel 함수 로그에서 환경 변수가 실제로 로드되는지 확인하는 것입니다!**

만약 로그에서 `❌ 없음`이 표시되면, 환경 변수가 런타임에 로드되지 않는 것입니다. 이 경우:
1. Vercel 환경 변수 재확인
2. Production 환경에 체크 확인
3. 재배포

---

## 요약

- ✅ 이미지 업로드 실패해도 기록 저장 (의도된 동작)
- ✅ 더 자세한 로깅 추가
- ⏭️ 재배포 후 Vercel 함수 로그 확인 필요
- ⏭️ 환경 변수 로드 여부 확인 필요

**재배포 후 Vercel 함수 로그에서 환경 변수 로그를 확인하고, 결과를 알려주세요!**

특히 `🔍 Cloudinary 환경 변수 확인:` 로그를 확인하면 문제를 빠르게 파악할 수 있습니다.
