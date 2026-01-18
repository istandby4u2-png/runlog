# Vercel 배포 오류 해결 가이드

## 오류 상태

- ❌ Deployment Details status: **error**

---

## 즉시 확인할 사항

### 1. 빌드 로그 확인

Vercel 대시보드에서:

1. **프로젝트 페이지 접속**
2. **실패한 배포 클릭**
3. **"Build Logs" 또는 "Logs" 탭 확인**
4. **오류 메시지 확인**

---

## 일반적인 오류와 해결

### 오류 1: "Module not found" 또는 "Cannot find module"

**원인:** 패키지가 설치되지 않았거나 import 경로 오류

**해결:**
1. `package.json`에 필요한 패키지가 있는지 확인
2. 로컬에서 테스트:
   ```bash
   npm install
   npm run build
   ```

### 오류 2: "Environment Variable Missing"

**원인:** 환경 변수가 설정되지 않음

**해결:**
1. Vercel > 프로젝트 > Settings > Environment Variables
2. 다음 변수들이 모두 추가되었는지 확인:
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
   - `JWT_SECRET`
   - `GEMINI_API_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
3. **Production, Preview, Development 모두에 추가** 확인

### 오류 3: "Type error" 또는 TypeScript 오류

**원인:** TypeScript 타입 오류

**해결:**
1. 빌드 로그에서 타입 오류 확인
2. 로컬에서 확인:
   ```bash
   npm run build
   ```
3. 타입 오류 수정

### 오류 4: "Build failed" 또는 "Command failed"

**원인:** 빌드 명령어 오류

**해결:**
1. 빌드 로그에서 구체적인 오류 확인
2. Vercel 프로젝트 설정에서 Build Command 확인:
   - `npm run build` (기본값)

### 오류 5: "Supabase connection failed"

**원인:** Supabase 환경 변수 오류 또는 스키마 미생성

**해결:**
1. Supabase 환경 변수가 올바른지 확인
2. Supabase 스키마가 생성되었는지 확인

---

## 단계별 해결

### Step 1: 빌드 로그 확인

Vercel 대시보드에서:
1. 실패한 배포 클릭
2. "Logs" 또는 "Build Logs" 탭 확인
3. **마지막 오류 메시지 확인**

### Step 2: 오류 메시지 분석

빌드 로그에서 다음을 찾으세요:
- `Error:` 또는 `Failed:`
- `Module not found`
- `Environment Variable`
- `Type error`
- `Cannot find`

### Step 3: 로컬 빌드 테스트

터미널에서:

```bash
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"

# 의존성 설치
npm install

# 빌드 테스트
npm run build
```

**로컬 빌드가 실패하면:**
- 오류 메시지 확인
- 문제 수정
- 다시 빌드 테스트

**로컬 빌드가 성공하면:**
- 환경 변수 문제일 가능성
- Vercel 환경 변수 확인

---

## 빠른 체크리스트

- [ ] 빌드 로그 확인 완료
- [ ] 오류 메시지 확인 완료
- [ ] 로컬 빌드 테스트 완료
- [ ] 환경 변수 확인 완료
- [ ] Supabase 스키마 확인 완료

---

## 도움 요청 시 제공할 정보

문제가 계속되면 다음 정보를 제공해주세요:

1. **빌드 로그의 마지막 오류 메시지** (전체)
2. **로컬 빌드 결과** (`npm run build` 출력)
3. **환경 변수 추가 여부** (9개 모두)
4. **Supabase 스키마 생성 여부**

---

## 다음 단계

1. ✅ 빌드 로그 확인
2. ✅ 오류 메시지 분석
3. ✅ 문제 해결
4. ✅ 다시 배포

빌드 로그의 오류 메시지를 알려주시면 더 구체적으로 도와드릴 수 있습니다!
