# Viewport 경고 해결

## 발견된 경고

```
⚠ Unsupported metadata viewport is configured in metadata export in /records/new. 
Please move it to viewport export instead.
```

**의미:** Next.js 14에서 `viewport`를 `metadata` export에 포함하는 것이 deprecated되었습니다. 대신 별도의 `viewport` export를 사용해야 합니다.

---

## 해결 방법

### 변경 전

```typescript
export const metadata: Metadata = {
  title: 'RunLog - 러닝코스 서비스',
  description: '러닝코스를 등록하고 공유하며, 매일의 러닝 기록을 업로드하세요',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
}
```

### 변경 후

```typescript
import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'RunLog - 러닝코스 서비스',
  description: '러닝코스를 등록하고 공유하며, 매일의 러닝 기록을 업로드하세요',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}
```

---

## 수정된 파일

- `app/layout.tsx` - `viewport`를 `metadata`에서 분리하여 별도 export로 이동

---

## 다음 단계

1. ✅ `layout.tsx` 수정 완료
2. ⏭️ 변경사항 커밋 및 푸시
3. ⏭️ Vercel 재배포 대기
4. ⏭️ 경고 메시지 확인

---

## 참고

이 경고는 **빌드를 막지 않습니다**. 하지만 Next.js의 권장 사항을 따르는 것이 좋습니다.

---

## 변경사항 커밋

```bash
cd "/Users/user/Library/Mobile Documents/com~apple~CloudDocs/NAVER/플레이스/커서"

git add app/layout.tsx
git commit -m "Fix viewport warning: move viewport to separate export"
git push origin main
```

GitHub에 푸시하면 Vercel이 자동으로 재배포를 시작합니다.
