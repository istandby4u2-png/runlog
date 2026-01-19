# Cloudinary + Vercel 환경 변수 설정 가이드

## ✅ 현재 상태
- 이미지 압축: **작동 중** ✅
- 413 에러: **해결됨** ✅
- Cloudinary 업로드: **환경 변수 설정 필요**

---

## 📋 Cloudinary 환경 변수 설정

### 1단계: Cloudinary 정보 확인

1. **Cloudinary 대시보드 접속**
   - 🔗 https://console.cloudinary.com/

2. **로그인 후 Dashboard 페이지**

3. **API Keys 섹션 확인:**
   ```
   Cloud Name: dwcx3cxxd
   API Key: 123456789012345
   API Secret: [Show 버튼 클릭]
   ```

4. **3가지 정보를 메모장에 복사:**
   - Cloud Name
   - API Key
   - API Secret (Show 버튼 클릭 후 복사)

---

### 2단계: Vercel 환경 변수 설정

1. **Vercel 대시보드 접속**
   - 🔗 https://vercel.com/

2. **프로젝트 선택** → **Settings** → **Environment Variables**

3. **다음 3개 변수 추가:**

#### 변수 1: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
```
Name: NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
Value: [Cloudinary Cloud Name 붙여넣기]

환경 선택:
✅ Production
✅ Preview  
✅ Development
```

#### 변수 2: CLOUDINARY_API_KEY
```
Name: CLOUDINARY_API_KEY
Value: [Cloudinary API Key 붙여넣기]

환경 선택:
✅ Production
✅ Preview
✅ Development
```

#### 변수 3: CLOUDINARY_API_SECRET
```
Name: CLOUDINARY_API_SECRET
Value: [Cloudinary API Secret 붙여넣기]

환경 선택:
✅ Production
✅ Preview
✅ Development
```

4. **Save 버튼 클릭**

---

### 3단계: 재배포

환경 변수 추가 후 **반드시 재배포** 필요:

#### 방법 1: Vercel에서 재배포
1. **Deployments** 탭
2. 최신 배포의 **⋯** (점 3개) 클릭
3. **Redeploy** 클릭
4. **Redeploy** 확인

#### 방법 2: Git으로 재배포
```bash
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/cursor"
git commit --allow-empty -m "Trigger redeploy for Cloudinary env vars"
git push origin main
```

---

### 4단계: 테스트

재배포 완료 후 (2-3분):

1. **프로덕션 사이트 접속**
2. **코스 또는 기록 등록**
3. **이미지 선택**
   - Console에서 압축 로그 확인 ✅
4. **저장**
5. **이미지 표시 확인** ✅

---

## 🔍 환경 변수 확인 방법

### 방법 1: Vercel 함수 로그

1. **Vercel 대시보드** → **Logs**
2. 이미지 업로드 시도
3. 다음 로그 찾기:

```
✅ 정상:
🔍 Cloudinary 환경 변수 확인:
   - NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: 설정됨 (dwcx3cxxd)
   - CLOUDINARY_API_KEY: 설정됨 (1234...)
   - CLOUDINARY_API_SECRET: 설정됨 (abcd...)
📤 Cloudinary 업로드 시작...
✅ Cloudinary 업로드 성공: https://res.cloudinary.com/...
```

```
❌ 문제:
🔍 Cloudinary 환경 변수 확인:
   - NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: ❌ 없음
   - CLOUDINARY_API_KEY: ❌ 없음
   - CLOUDINARY_API_SECRET: ❌ 없음
❌ Cloudinary 환경 변수가 설정되지 않았습니다.
```

---

## 🚨 주의사항

### 1. 모든 환경에 체크 필수
- ✅ Production
- ✅ Preview
- ✅ Development

3개 모두 체크하지 않으면 작동하지 않습니다!

### 2. 환경 변수 추가 후 반드시 재배포
환경 변수만 추가하고 재배포하지 않으면 적용되지 않습니다!

### 3. Cloud Name vs API Key
- **NEXT_PUBLIC_**로 시작하는 것은 Cloud Name만
- API Key와 Secret은 **NEXT_PUBLIC_** 없이

### 4. 공백 주의
복사할 때 앞뒤 공백이 포함되지 않도록 주의!

---

## ✅ 체크리스트

완료한 항목에 체크:

- [ ] Cloudinary 대시보드 접속
- [ ] Cloud Name, API Key, API Secret 복사
- [ ] Vercel Environment Variables 페이지 접속
- [ ] NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME 추가
- [ ] CLOUDINARY_API_KEY 추가
- [ ] CLOUDINARY_API_SECRET 추가
- [ ] 3개 변수 모두 Production/Preview/Development 체크
- [ ] 재배포 (Vercel 또는 Git)
- [ ] 재배포 완료 대기 (2-3분)
- [ ] 이미지 업로드 테스트
- [ ] Vercel 로그 확인

---

## 📞 문제 해결

### 문제 1: Cloudinary 계정이 없어요
**해결:**
1. https://cloudinary.com/users/register/free 접속
2. 무료 계정 생성
3. 이메일 인증 완료

### 문제 2: API Secret을 찾을 수 없어요
**해결:**
- Dashboard → API Keys 섹션
- API Secret 옆의 **Show** 버튼 클릭

### 문제 3: 환경 변수를 추가했는데도 안 돼요
**해결:**
1. 재배포했는지 확인
2. Production 환경에 체크했는지 확인
3. Vercel 로그에서 환경 변수 로드 확인

### 문제 4: Vercel 로그에서 401 에러
**해결:**
- API Key 또는 Secret이 잘못됨
- Cloudinary에서 다시 복사
- Vercel 환경 변수 업데이트 후 재배포

---

## 💡 완료 후

설정이 완료되면:
- ✅ 이미지 자동 압축
- ✅ Cloudinary 업로드
- ✅ 이미지 표시
- ✅ 모든 기능 정상 작동

**모든 사용자가 업로드한 이미지를 볼 수 있습니다!** 🎉
