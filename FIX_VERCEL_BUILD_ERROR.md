# Vercel 빌드 오류 해결

## 빌드 상태

✅ **빌드 성공**
- ✓ Compiled successfully
- ✓ Generating static pages (19/19)

❌ **Vercel 설정 오류**
```
Error: No Output Directory named "public" found after the Build completed.
```

---

## 문제 분석

### 1. Output Directory 오류

**원인:** Vercel이 `public` 폴더를 찾고 있지만, Next.js는 `.next` 폴더에 빌드 결과를 생성합니다.

**해결:** `vercel.json` 파일을 생성하여 올바른 설정 지정

### 2. Dynamic Server Usage 경고

**원인:** `/profile` 페이지가 `cookies()`를 사용하므로 정적으로 렌더링할 수 없습니다.

**해결:** `export const dynamic = 'force-dynamic'` 추가하여 명시적으로 동적 라우트로 표시

---

## 수정된 내용

### 1. vercel.json 파일 생성

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs"
}
```

### 2. 동적 라우트 명시

- `app/page.tsx` - `export const dynamic = 'force-dynamic'` 추가
- `app/profile/page.tsx` - `export const dynamic = 'force-dynamic'` 추가

---

## 다음 단계

### 1. 변경사항 커밋 및 푸시

```bash
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"

# 변경사항 추가
git add .

# 커밋
git commit -m "Fix Vercel build configuration and dynamic routes"

# GitHub에 푸시
git push origin main
```

### 2. Vercel 재배포

GitHub에 푸시하면 Vercel이 자동으로 재배포를 시작합니다.

---

## 경고 메시지에 대해

다음 경고들은 **정상적**이며 빌드를 막지 않습니다:

- `Dynamic server usage` - `/profile` 페이지는 동적이어야 하므로 정상
- `Unsupported metadata viewport` - 경고일 뿐, 빌드에 영향 없음

---

## 예상 결과

재배포 후:
- ✅ 빌드 성공
- ✅ Output Directory 오류 해결
- ✅ 배포 완료

---

## 문제 해결

### 여전히 오류가 발생한다면

1. **Vercel 프로젝트 설정 확인**
   - Settings > General
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next` (또는 비워두기 - vercel.json 사용)

2. **빌드 로그 확인**
   - 오류 메시지 확인
   - 환경 변수 확인

---

## 체크리스트

- [x] vercel.json 파일 생성
- [x] 동적 라우트 명시
- [ ] 변경사항 커밋 및 푸시
- [ ] Vercel 재배포 확인
- [ ] 배포 성공 확인

---

## 축하합니다! 🎉

빌드는 성공했습니다! 설정만 수정하면 됩니다.

변경사항을 커밋하고 푸시하면 Vercel이 자동으로 재배포합니다.
