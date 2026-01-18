# 수면 필드 추가

## 구현 완료

기록 등록 시 수면 정보를 입력할 수 있는 필드를 추가했습니다:

1. ✅ `types/index.ts`에 `sleep_hours`, `sleep_quality` 필드 추가
2. ✅ `components/RecordForm.tsx`에 수면 입력 필드 추가
3. ✅ `lib/db-supabase.ts`에 수면 필드 처리 추가
4. ✅ `app/api/records/route.ts`에 수면 필드 처리 추가
5. ✅ `app/api/records/[id]/route.ts`에 수면 필드 처리 추가
6. ✅ `components/Feed.tsx`에 수면 정보 표시 추가

---

## 데이터베이스 스키마 업데이트 필요

**중요:** Supabase 데이터베이스에 수면 필드를 추가해야 합니다.

### Supabase SQL Editor에서 실행:

```sql
-- running_records 테이블에 수면 필드 추가
ALTER TABLE running_records
ADD COLUMN IF NOT EXISTS sleep_hours REAL,
ADD COLUMN IF NOT EXISTS sleep_quality TEXT;
```

---

## 기능 설명

### 1. 수면 시간 (Sleep Hours)

- **타입:** 숫자 (실수)
- **입력:** 숫자 입력란
- **범위:** 0-24 시간
- **단위:** 시간 (hours)
- **예시:** 7.5 (7시간 30분)

### 2. 수면의 질 (Sleep Quality)

- **타입:** 선택 (셀렉박스)
- **옵션:**
  - `deep`: Deep Sleep (숙면)
  - `woke_once`: Woke Once (1번 깸)
  - `woke_multiple`: Woke 2+ Times (2번 이상 깸)

---

## UI 변경 사항

### RecordForm (기록 입력 폼)

- **위치:** Pre-run Meal 필드 다음
- **레이아웃:** 2열 그리드 (Sleep Hours, Sleep Quality)
- **라벨:** 영어로 표시
  - "Sleep Hours"
  - "Sleep Quality"

### Feed (피드)

- **위치:** Pre-run Meal 정보 다음
- **스타일:** 파란색 배경 박스
- **표시 내용:**
  - Sleep Hours: "X hrs"
  - Sleep Quality: "Deep Sleep" / "Woke Once" / "Woke 2+ Times"

---

## 코드 변경 사항

### 1. `types/index.ts`

```typescript
export interface RunningRecord {
  // ... 기존 필드
  sleep_hours?: number;
  sleep_quality?: string;
}
```

### 2. `components/RecordForm.tsx`

- `sleepHours`, `sleepQuality` state 추가
- 수면 입력 필드 추가
- FormData에 수면 필드 추가

### 3. `lib/db-supabase.ts`

- `runningRecords.create()`에 `sleep_hours`, `sleep_quality` 추가
- `runningRecords.update()`에 `sleep_hours`, `sleep_quality` 추가

### 4. `app/api/records/route.ts`

- POST 요청에서 `sleep_hours`, `sleep_quality` 처리

### 5. `app/api/records/[id]/route.ts`

- PUT 요청에서 `sleep_hours`, `sleep_quality` 처리

### 6. `components/Feed.tsx`

- 수면 정보 표시 추가

---

## 다음 단계

1. ✅ 코드 변경 완료
2. ⏭️ **Supabase 데이터베이스 스키마 업데이트** (중요!)
3. ⏭️ 코드 커밋 및 푸시
4. ⏭️ 프로덕션에서 테스트

---

## Supabase 스키마 업데이트 방법

### Step 1: Supabase 대시보드 접속

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택

### Step 2: SQL Editor 열기

1. 왼쪽 메뉴에서 **SQL Editor** 클릭
2. **New query** 클릭

### Step 3: SQL 실행

다음 SQL을 복사하여 실행:

```sql
-- running_records 테이블에 수면 필드 추가
ALTER TABLE running_records
ADD COLUMN IF NOT EXISTS sleep_hours REAL,
ADD COLUMN IF NOT EXISTS sleep_quality TEXT;
```

### Step 4: 확인

1. **Table Editor**에서 `running_records` 테이블 확인
2. `sleep_hours`, `sleep_quality` 컬럼이 추가되었는지 확인

---

## 확인 사항

- [ ] Supabase 데이터베이스 스키마 업데이트 완료
- [ ] 기록 등록 시 수면 필드 입력 가능
- [ ] 기록 수정 시 수면 필드 수정 가능
- [ ] 피드에서 수면 정보 표시 확인

---

## 요약

- ✅ 수면 시간 입력 필드 추가 (숫자)
- ✅ 수면의 질 선택 필드 추가 (셀렉박스)
- ✅ 영어로 구현
- ✅ 피드에 수면 정보 표시
- ⏭️ **Supabase 데이터베이스 스키마 업데이트 필요**

**중요:** Supabase SQL Editor에서 스키마를 업데이트한 후 사용할 수 있습니다!
