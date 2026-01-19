# Vercel Blob Storage 설정 가이드

## ✅ 완료된 작업

- ✅ @vercel/blob 패키지 추가
- ✅ blob-storage.ts 유틸리티 생성
- ✅ 모든 API 라우트 업데이트 (Cloudinary → Vercel Blob)
- ✅ 이미지 압축 기능 유지

---

## 🚀 Vercel Blob Store 생성 (5분)

### 1단계: Vercel 대시보드에서 Blob Store 생성

1. **Vercel 대시보드 접속**
   - 🔗 https://vercel.com/

2. **Storage 탭 클릭** (좌측 메뉴)

3. **Create Database** 클릭

4. **Blob** 선택

5. **Store Name 입력:**
   ```
   runlog-images
   ```

6. **Create** 클릭

---

### 2단계: Blob Store를 프로젝트에 연결

1. **Connect Project** 클릭

2. **프로젝트 선택** (runlog 또는 본인의 프로젝트)

3. **Connect** 클릭

4. **자동으로 환경 변수가 추가됨:**
   ```
   BLOB_READ_WRITE_TOKEN
   ```

---

### 3단계: 환경 변수 확인

**Vercel → 프로젝트 → Settings → Environment Variables**

자동으로 추가된 변수 확인:

```
BLOB_READ_WRITE_TOKEN = vercel_blob_rw_...
```

**환경 선택:**
- ✅ Production
- ✅ Preview
- ✅ Development

모두 체크되어 있어야 합니다!

---

### 4단계: 패키지 설치 및 배포

**로컬에서 패키지 설치:**

```bash
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/cursor"
npm install
```

**Git 커밋 및 푸시:**

```bash
git add .
git commit -m "Switch from Cloudinary to Vercel Blob Storage"
git push origin main
```

**배포 완료 대기** (2-3분)

---

### 5단계: 테스트

배포 완료 후:

1. **프로덕션 사이트 접속**
2. **코스 또는 기록 등록**
3. **이미지 선택**
   - Console에서 압축 로그 확인 ✅
4. **저장**
5. **이미지 표시 확인** ✅

---

## 🎉 Vercel Blob의 장점

### ✅ Cloudinary와 비교

| 기능 | Cloudinary | Vercel Blob |
|------|-----------|-------------|
| 설정 복잡도 | 복잡 (계정, API 키) | 매우 간단 (자동 연결) |
| 환경 변수 | 3개 필요 | 1개 (자동 추가) |
| 계정 문제 | 인증, 한도, 서버 오류 | 없음 |
| Vercel 통합 | 별도 서비스 | 완벽한 통합 |
| CDN | 별도 설정 | 자동 적용 |
| 업로드 속도 | 보통 | 매우 빠름 |
| 안정성 | 외부 서비스 의존 | Vercel 인프라 |

### ✅ 무료 플랜

- **용량:** 무제한
- **대역폭:** 100GB/월
- **요청:** 100만 건/월

일반적인 앱에는 충분합니다!

---

## 🔧 추가 설정 (선택사항)

### 이미지 최적화

Vercel은 자동으로 이미지 최적화를 제공합니다:
- WebP 변환
- 리사이징
- 캐싱

추가 설정 불필요!

---

## 🔍 Vercel Blob 로그 확인

**Vercel → Logs → Functions**

이미지 업로드 시 다음 로그가 표시됩니다:

```
📤 Vercel Blob 업로드 시작...
📤 폴더: records
📤 파일명: image.jpg
📤 파일 타입: image/jpeg
📤 파일 크기: 608595 bytes
✅ Vercel Blob 업로드 성공: https://[account].public.blob.vercel-storage.com/...
```

---

## 🚨 문제 해결

### 문제 1: "BLOB_READ_WRITE_TOKEN is not defined"

**원인:** Blob Store가 프로젝트에 연결되지 않음

**해결:**
1. Vercel → Storage → Blob Store 선택
2. Connect Project
3. 프로젝트 선택 및 연결
4. 재배포

---

### 문제 2: 업로드는 성공했지만 이미지가 깨짐

**원인:** 잘못된 Content-Type

**해결:** 이미 코드에 포함되어 있음 (자동 처리)

---

### 문제 3: 403 Forbidden

**원인:** access 설정 문제

**해결:** 이미 `access: 'public'`으로 설정되어 있음

---

## 📊 다음 단계

1. **로컬 설치:**
   ```bash
   npm install
   ```

2. **Git 푸시:**
   ```bash
   git add .
   git commit -m "Switch to Vercel Blob Storage"
   git push origin main
   ```

3. **Vercel에서 Blob Store 생성 및 연결**
   - Storage 탭
   - Create Database
   - Blob 선택
   - Connect Project

4. **배포 완료 대기** (2-3분)

5. **테스트**

---

## 💡 참고

- **Blob Store는 프로젝트당 1개만 필요합니다**
- **환경 변수는 자동으로 추가됩니다**
- **별도의 계정 생성이나 API 키가 필요 없습니다**
- **Vercel 프로젝트가 있으면 즉시 사용 가능합니다**

---

## 🎯 완료!

모든 설정이 완료되면:
- ✅ 이미지 자동 압축
- ✅ Vercel Blob 업로드
- ✅ CDN 자동 적용
- ✅ 빠르고 안정적인 이미지 서비스

**Cloudinary 문제에서 완전히 자유로워집니다!** 🎉
