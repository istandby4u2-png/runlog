# Cloudinary 오류 해결 가이드

## 발견된 오류

```
❌ Cloudinary 업로드 실패: {
  message: `Server return invalid JSON response. Status Code 500. SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON`,
  name: 'Error',
  http_code: 500
}
```

**의미:** Cloudinary API가 HTML 응답을 반환하고 있습니다. 이는 일반적으로 **인증 오류**를 의미합니다.

---

## 원인

Cloudinary API가 HTML 응답을 반환하는 경우:

1. **API 키 또는 시크릿이 잘못됨**
2. **Cloudinary 계정에 문제가 있음**
3. **환경 변수가 제대로 설정되지 않음**

---

## 해결 방법

### Step 1: Cloudinary 환경 변수 확인

Vercel > Settings > Environment Variables에서 다음 변수를 확인:

1. **`NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`**
   - Cloudinary Dashboard > Settings > Cloud name
   - 예: `dwcx3cxxd`

2. **`CLOUDINARY_API_KEY`**
   - Cloudinary Dashboard > Settings > API Key
   - **주의:** 숫자 값만 복사 (예: `889538896366331`)
   - "root"라는 이름은 무시하고 숫자만 복사

3. **`CLOUDINARY_API_SECRET`**
   - Cloudinary Dashboard > Settings > API Secret
   - **주의:** "Reveal" 버튼을 클릭해야 보입니다
   - 예: `cxGoHkFn5FdUxwFzNqGY8qAaTMI`

**중요:** 각 변수의 **Production** 체크박스가 체크되어 있어야 합니다!

---

### Step 2: Cloudinary 대시보드에서 값 재확인

1. **Cloudinary 대시보드 접속**
   - https://cloudinary.com/console
   - 로그인

2. **Settings 메뉴 클릭**
   - 왼쪽 사이드바에서 "Settings" 클릭

3. **Product environment settings 확인**
   - **Cloud name:** 문자열 (예: `dwcx3cxxd`)
   - **API Key:** 숫자 (예: `889538896366331`)
   - **API Secret:** "Reveal" 클릭 후 문자열 (예: `cxGoHkFn5FdUxwFzNqGY8qAaTMI`)

4. **값 복사**
   - 각 값을 정확히 복사
   - 공백이나 따옴표가 포함되지 않도록 주의

---

### Step 3: Vercel 환경 변수 업데이트

1. **Vercel > Settings > Environment Variables**

2. **각 변수 확인 및 업데이트**
   - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

3. **값 재입력**
   - Cloudinary 대시보드에서 복사한 값으로 업데이트
   - **주의:** 공백이나 따옴표가 포함되지 않도록 주의

4. **Production 환경 체크 확인**
   - 각 변수의 **Production** 체크박스가 체크되어 있는지 확인

---

### Step 4: 재배포

1. **자동 재배포 대기**
   - Vercel이 자동으로 재배포를 시작할 수 있습니다

2. **또는 수동 재배포**
   - Deployments > 최근 배포 > "..." 메뉴 > "Redeploy"
   - 재배포가 완료될 때까지 대기 (보통 1-2분)

---

## 확인 사항

### 올바른 값 예시

```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dwcx3cxxd
CLOUDINARY_API_KEY=889538896366331
CLOUDINARY_API_SECRET=cxGoHkFn5FdUxwFzNqGY8qAaTMI
```

### 잘못된 값 예시

```
# 잘못됨: "root"를 값으로 사용
CLOUDINARY_API_KEY=root

# 잘못됨: 따옴표 포함
CLOUDINARY_API_KEY="889538896366331"

# 잘못됨: 공백 포함
CLOUDINARY_API_KEY=889538896366331 

# 올바름: 숫자 값만
CLOUDINARY_API_KEY=889538896366331
```

---

## 문제 해결 체크리스트

- [ ] Cloudinary 대시보드에서 값 재확인
- [ ] Vercel 환경 변수에 올바른 값 입력
- [ ] Production 환경에 체크 확인
- [ ] 공백이나 따옴표가 포함되지 않았는지 확인
- [ ] 재배포 완료 확인
- [ ] 프로덕션에서 이미지 업로드 테스트

---

## 추가 디버깅

### Cloudinary 연결 테스트

Cloudinary 대시보드에서 직접 업로드를 시도해보세요:

1. **Cloudinary 대시보드 > Media Library**
2. **"Upload" 버튼 클릭**
3. **이미지 업로드 시도**
4. **성공하면 Cloudinary 계정은 정상**

---

## 다음 단계

1. ✅ Cloudinary 환경 변수 재확인
2. ✅ Vercel 환경 변수 업데이트
3. ⏭️ 재배포 대기
4. ⏭️ 프로덕션에서 이미지 업로드 테스트
5. ⏭️ Vercel 함수 로그 확인

**Cloudinary 환경 변수를 올바르게 설정한 후, 재배포를 기다리고 프로덕션에서 다시 시도해보세요!**

문제가 계속되면 Cloudinary 대시보드에서 API 키와 시크릿을 재생성해보세요.
