# 코스 수정 기능 추가

## 구현 완료

코스 수정 기능을 추가했습니다:

1. ✅ `lib/db-supabase.ts`에 `courses.update` 메서드 추가
2. ✅ `app/api/courses/[id]/route.ts`에 PUT 메서드 추가
3. ✅ `app/courses/[id]/edit/page.tsx` 생성
4. ✅ `components/CourseForm.tsx`에 수정 모드 지원 추가
5. ✅ `components/CourseDetail.tsx`에 수정 버튼 추가

---

## 기능 설명

### 1. 코스 수정 페이지

- **경로:** `/courses/[id]/edit`
- **접근:** 코스 소유자만 수정 가능
- **기능:**
  - 기존 코스 정보 로드
  - 제목, 설명, 경로, 이미지 수정 가능
  - 이미지 삭제 가능

### 2. 코스 상세 페이지에 수정 버튼

- **위치:** 코스 제목 옆
- **표시 조건:** 코스 소유자만 표시
- **기능:** 클릭 시 수정 페이지로 이동

### 3. 코스 수정 API

- **엔드포인트:** `PUT /api/courses/[id]`
- **기능:**
  - 코스 소유자 확인
  - 제목, 설명, 경로, 이미지 수정
  - 이미지 삭제 지원
  - 이미지 업로드 실패해도 코스 수정 가능

---

## 사용 방법

### 코스 수정하기

1. **코스 상세 페이지 접속**
   - `/courses/[id]` 경로

2. **수정 버튼 클릭**
   - 코스 제목 옆 "Edit" 버튼 클릭
   - 코스 소유자만 표시됨

3. **코스 정보 수정**
   - 제목, 설명 수정
   - 지도에서 경로 수정 (새로 그리기)
   - 이미지 변경 또는 삭제

4. **수정 완료**
   - "수정하기" 버튼 클릭
   - 코스 목록으로 이동

---

## 코드 변경 사항

### 1. `lib/db-supabase.ts`

```typescript
async update(id: number, course: {
  title?: string;
  description?: string | null;
  path_data?: string;
  image_url?: string | null;
  distance?: number | null;
}) {
  // 코스 업데이트 로직
}
```

### 2. `app/api/courses/[id]/route.ts`

- PUT 메서드 추가
- 소유자 확인
- 이미지 업로드/삭제 처리

### 3. `components/CourseForm.tsx`

- `courseId` prop 추가 (수정 모드)
- 기존 코스 데이터 로드
- 수정 모드 UI 지원

### 4. `components/CourseDetail.tsx`

- 수정 버튼 추가
- 소유자만 표시

---

## 다음 단계

1. ✅ 코스 수정 기능 구현 완료
2. ⏭️ 코드 커밋 및 푸시
3. ⏭️ 프로덕션에서 테스트

---

## 확인 사항

- [ ] 코스 수정 페이지 접근 가능
- [ ] 기존 코스 정보 로드 정상
- [ ] 코스 수정 정상 작동
- [ ] 이미지 수정/삭제 정상 작동
- [ ] 소유자만 수정 버튼 표시

---

## 요약

- ✅ 코스 수정 기능 구현 완료
- ✅ 소유자 권한 확인
- ✅ 이미지 수정/삭제 지원
- ✅ 수정 모드 UI 지원

**코스를 수정할 수 있는 기능이 추가되었습니다!**

코드를 커밋하고 푸시한 후 프로덕션에서 테스트해보세요.
