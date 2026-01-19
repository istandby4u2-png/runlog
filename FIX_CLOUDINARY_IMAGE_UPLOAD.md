# Cloudinary 이미지 업로드 문제 해결

## 📋 증상
- ✅ 코스/기록/프로필 등록은 성공
- ❌ 이미지만 업로드되지 않음
- ❌ 오류 메시지 없음 (조용히 실패)
- 🌐 Vercel 프로덕션 환경에서 발생

---

## 🔍 원인
Cloudinary 환경 변수가 Vercel에 제대로 설정되지 않았거나, API 키에 문제가 있습니다.

---

## ✅ 해결 방법

### 1단계: Cloudinary 계정 정보 확인

1. **Cloudinary 대시보드 접속**
   - 🔗 https://console.cloudinary.com/

2. **Dashboard 페이지에서 API Keys 섹션 확인**
   ```
   Cloud Name: dwcx3cxxd (예시)
   API Key: 123456789012345 (예시)
   API Secret: [Click to reveal]
   ```

3. **다음 정보를 복사해두세요:**
   - `Cloud Name`
   - `API Key`
   - `API Secret` (Show 버튼 클릭)

---

### 2단계: Vercel 환경 변수 설정

1. **Vercel 대시보드 접속**
   - 🔗 https://vercel.com/

2. **프로젝트 선택** → **Settings** → **Environment Variables**

3. **다음 3개 변수 확인/추가:**

   #### ① NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
   ```
   Key: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
   Value: [Cloudinary Cloud Name]
   ✅ Production
   ✅ Preview
   ✅ Development
   ```

   #### ② CLOUDINARY_API_KEY
   ```
   Key: CLOUDINARY_API_KEY
   Value: [Cloudinary API Key]
   ✅ Production
   ✅ Preview
   ✅ Development
   ```

   #### ③ CLOUDINARY_API_SECRET
   ```
   Key: CLOUDINARY_API_SECRET
   Value: [Cloudinary API Secret]
   ✅ Production
   ✅ Preview
   ✅ Development
   ```

4. **중요:** 모든 환경에 체크표시 확인!

---

### 3단계: 재배포

환경 변수를 추가/수정한 후:

1. **Vercel 대시보드** → **Deployments** 탭
2. **최신 배포** → **⋯** (점 3개) → **Redeploy**
3. 또는 Git push로 자동 배포:
   ```bash
   git commit --allow-empty -m "Trigger redeploy for Cloudinary fix"
   git push origin main
   ```

---

### 4단계: 테스트

재배포 완료 후:

1. **프로덕션 사이트 접속**
2. **코스 또는 기록 등록**
3. **이미지 첨부 후 저장**
4. **이미지가 표시되는지 확인**

---

### 5단계: 로그 확인 (문제가 계속되면)

1. **Vercel 대시보드** → **Logs** 탭
2. **이미지 업로드 시도 시간** 확인
3. **다음 로그 찾기:**
   ```
   🔍 Cloudinary 환경 변수 확인:
      - NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: 설정됨 (dwcx3cxxd)
      - CLOUDINARY_API_KEY: 설정됨 (1234...)
      - CLOUDINARY_API_SECRET: 설정됨 (abc...)
   ```

4. **오류 메시지 확인:**
   ```
   ❌ Cloudinary 업로드 실패:
   ❌ Cloudinary 인증 오류: ...
   ```

---

## 🚨 자주 발생하는 문제

### 문제 1: 환경 변수가 체크되지 않음
**해결:** Production, Preview, Development 모두 체크

### 문제 2: API Secret이 잘못 복사됨
**해결:** Cloudinary에서 다시 복사 (공백 없이)

### 문제 3: 환경 변수 업데이트 후 재배포 안 함
**해결:** 반드시 재배포 필요!

### 문제 4: Cloudinary 계정 비활성화
**해결:** 
- Cloudinary 이메일 확인 (인증 메일)
- 대시보드에서 계정 상태 확인

---

## 🧪 빠른 테스트 방법

### Cloudinary 계정 테스트

1. **Cloudinary 대시보드** → **Media Library**
2. **Upload** 버튼 클릭
3. **이미지 업로드 시도**
4. 성공하면 계정은 정상 ✅

---

## 📞 추가 지원

문제가 계속되면 다음 정보를 공유해주세요:

1. **Vercel 로그 스크린샷**
   - 특히 `🔍 Cloudinary 환경 변수 확인:` 부분

2. **브라우저 개발자 도구**
   - Network 탭 → `/api/records` 또는 `/api/courses` 응답 확인

3. **Cloudinary 계정 상태**
   - 활성화 여부
   - 이메일 인증 완료 여부

---

## ✅ 체크리스트

완료한 항목에 체크하세요:

- [ ] Cloudinary 계정 정보 확인 (Cloud Name, API Key, API Secret)
- [ ] Vercel 환경 변수 3개 모두 설정
- [ ] 모든 환경 (Production, Preview, Development)에 체크
- [ ] Vercel 재배포 완료
- [ ] 프로덕션에서 이미지 업로드 테스트
- [ ] Vercel 로그에서 환경 변수 로드 확인

---

## 💡 참고

현재 코드는 이미지 업로드 실패해도 데이터는 저장하도록 설정되어 있습니다.
따라서 오류 메시지가 표시되지 않고 조용히 실패합니다.

Vercel 로그를 확인하면 실제 오류 원인을 정확히 파악할 수 있습니다!
