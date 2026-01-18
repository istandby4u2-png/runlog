# Cloudinary 설정 명확화

## Cloudinary API Key Name "root"에 대해

### "root"는 문제가 아닙니다

- **"root"**는 Cloudinary에서 **API Key의 이름**입니다
- 이것은 **라벨/별칭**일 뿐이며, 실제로 사용하는 값이 아닙니다
- 실제로 사용해야 하는 값은 **API Key (숫자)**와 **API Secret**입니다

---

## Cloudinary에서 가져와야 하는 값

Cloudinary Dashboard > Settings에서 다음 **3가지 값**을 가져와야 합니다:

### 1. Cloud Name
- **위치:** Settings > Product environment settings > Cloud name
- **형태:** 문자열 (예: `dwcx3cxxd`)
- **Vercel 환경 변수:** `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- **예시:** `dwcx3cxxd`

### 2. API Key
- **위치:** Settings > Product environment settings > API Key
- **형태:** 숫자 (예: `889538896366331`)
- **Vercel 환경 변수:** `CLOUDINARY_API_KEY`
- **예시:** `889538896366331`
- **주의:** "root"라는 이름이 붙어있어도, 실제 값은 **숫자**입니다!

### 3. API Secret
- **위치:** Settings > Product environment settings > API Secret
- **형태:** 문자열 (예: `cxGoHkFn5FdUxwFzNqGY8qAaTMI`)
- **Vercel 환경 변수:** `CLOUDINARY_API_SECRET`
- **예시:** `cxGoHkFn5FdUxwFzNqGY8qAaTMI`
- **주의:** "Reveal" 버튼을 클릭해야 보입니다!

---

## Cloudinary Dashboard에서 값 확인 방법

### Step 1: Cloudinary Dashboard 접속

1. **Cloudinary 대시보드 접속**
   - https://cloudinary.com/console
   - 로그인

2. **Settings 메뉴 클릭**
   - 왼쪽 사이드바에서 "Settings" 클릭

### Step 2: Product environment settings 확인

1. **"Product environment settings" 섹션 찾기**
   - 페이지 상단 또는 중간에 위치

2. **다음 값 확인:**

   #### Cloud name
   - **라벨:** "Cloud name"
   - **값:** 문자열 (예: `dwcx3cxxd`)
   - **복사:** 이 값을 복사 → `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`

   #### API Key
   - **라벨:** "API Key" (옆에 "root"라고 표시될 수 있음)
   - **값:** 숫자 (예: `889538896366331`)
   - **복사:** 이 **숫자 값**을 복사 → `CLOUDINARY_API_KEY`
   - **주의:** "root"라는 이름은 무시하고, **숫자 값**만 복사!

   #### API Secret
   - **라벨:** "API Secret"
   - **값:** "Reveal" 버튼을 클릭해야 보임
   - **복사:** "Reveal" 클릭 후 나오는 값을 복사 → `CLOUDINARY_API_SECRET`

---

## Vercel 환경 변수 설정

### Step 1: Cloudinary Cloud Name

1. **Key:** `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
2. **Value:** Cloudinary Dashboard의 "Cloud name" 값
3. **예시:** `dwcx3cxxd`
4. **Environment:** ✅ Production, ✅ Preview, ✅ Development

### Step 2: Cloudinary API Key

1. **Key:** `CLOUDINARY_API_KEY`
2. **Value:** Cloudinary Dashboard의 "API Key" **숫자 값**
3. **예시:** `889538896366331`
4. **주의:** "root"라는 이름이 있어도, **숫자 값**만 복사!
5. **Environment:** ✅ Production, ✅ Preview, ✅ Development

### Step 3: Cloudinary API Secret

1. **Key:** `CLOUDINARY_API_SECRET`
2. **Value:** Cloudinary Dashboard의 "API Secret" 값 (Reveal 클릭 후)
3. **예시:** `cxGoHkFn5FdUxwFzNqGY8qAaTMI`
4. **Environment:** ✅ Production, ✅ Preview, ✅ Development

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

# 올바름: 숫자 값을 사용
CLOUDINARY_API_KEY=889538896366331
```

---

## 문제 해결

### 문제 1: "root"를 값으로 사용했을 경우

**증상:**
- 이미지 업로드 실패
- Cloudinary 인증 오류

**해결:**
1. Cloudinary Dashboard에서 **실제 API Key 숫자 값** 확인
2. Vercel 환경 변수에서 `CLOUDINARY_API_KEY` 값 수정
3. 재배포

### 문제 2: API Secret이 보이지 않을 경우

**해결:**
1. Cloudinary Dashboard > Settings
2. "API Secret" 옆의 **"Reveal" 버튼** 클릭
3. 나타나는 값을 복사

---

## 빠른 체크리스트

- [ ] Cloudinary Dashboard 접속
- [ ] Settings > Product environment settings 확인
- [ ] Cloud name 값 복사 → `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- [ ] API Key **숫자 값** 복사 → `CLOUDINARY_API_KEY` (root 이름 무시)
- [ ] API Secret "Reveal" 클릭 후 값 복사 → `CLOUDINARY_API_SECRET`
- [ ] Vercel 환경 변수에 모두 추가
- [ ] Production 환경에 체크
- [ ] 재배포

---

## 요약

- **"root"는 문제가 아닙니다** - 이것은 API Key의 이름일 뿐입니다
- 실제로 사용해야 하는 값은:
  - **Cloud name:** 문자열
  - **API Key:** 숫자 (root 옆에 있는 숫자)
  - **API Secret:** 문자열 (Reveal 클릭 후)

**중요:** API Key는 **숫자 값**을 사용해야 하며, "root"라는 이름은 무시하세요!
