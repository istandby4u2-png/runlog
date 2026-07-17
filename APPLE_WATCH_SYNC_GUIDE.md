# 애플워치 운동 자동 전송 — iPhone 단축어 설정 가이드

2026-07-09부터 Garmin 워치 → Apple Watch로 전환. Apple Health는 서버 API가
없으므로 iPhone 단축어가 매일 20:55에 오늘 운동을 RunLog로 전송하고,
21:00 daily-sync가 (Garmin 활동과 합쳐) 기록 생성 + Instagram 게시에 사용합니다.

## 동작 방식

```
iPhone 단축어 (매일 20:55 자동 실행)
  → Apple Health에서 오늘 운동 샘플 검색
  → POST https://runlog.life/api/workouts/ingest  (JSON)
  → 서버: 날짜별 저장 (같은 날짜 재전송 시 대체 → 여러 번 실행해도 안전)
  → 21:00 daily-sync가 합쳐서 기록 생성
```

## 1. 단축어 만들기

단축어 앱 → `+` → 이름: **RunLog 운동 전송**

1. **건강 샘플 찾기** (Find Health Samples)
   - 샘플 유형: **운동** (Workouts)
   - 필터: `시작 날짜` `이(가) 오늘임`
2. **각 항목 반복** (Repeat with Each) — 항목: `건강 샘플`
   - 반복 안에 **사전(Dictionary)** 동작 추가, 항목들:
     - `start` (텍스트) = `반복 항목`의 **시작 날짜** (변수 탭에서 선택, 형식: ISO 8601)
     - `type` (텍스트) = `반복 항목`의 **운동 유형**
     - `durationMinutes` (텍스트) = `반복 항목`의 **지속 시간** (분 단위)
     - `distanceKm` (텍스트) = `반복 항목`의 **거리** (km 단위)
     - `calories` (텍스트) = `반복 항목`의 **활성 에너지**
   - **변수에 추가** — 변수 이름: `workoutList`
3. 반복 밖에서 **사전** 동작: 키 `workouts` (배열) = `workoutList`
4. **URL 콘텐츠 가져오기**
   - URL: `https://runlog.life/api/workouts/ingest`
   - 방법: **POST**, 요청 본문: **JSON** → 3번 사전
   - 헤더: `Authorization` = `Bearer <CRON_SECRET 값>`
     (사진 단축어와 같은 값. Mac 터미널: `grep '^CRON_SECRET=' .env.local | cut -d'"' -f2 | pbcopy`)
5. (선택) **알림 표시** — `URL 콘텐츠` 결과 확인

값의 단위 표기(예: "10.52 km", "58분")가 섞여 있어도 서버가 숫자만 추출하므로
괜찮습니다. 운동 유형은 한글/영문 모두 인식합니다 (달리기/Running/사이클링/근력 등).

## 2. 매일 20:55 자동 실행

자동화 탭 → `+` → 개인 자동화 → **특정 시간**: 매일 오후 8:55
→ 단축어: **RunLog 운동 전송** → **즉시 실행**

## 3. 7/9~17 밀린 운동 백필 (1회)

1. 위 단축어의 1번 필터를 잠시 `시작 날짜` `이(가) 지난 30일 이내임`으로 변경
2. 단축어를 **수동으로 1회 실행** → 서버가 날짜별로 자동 분류 저장
3. 필터를 다시 `오늘`로 되돌리기
4. Claude에게 알리면 해당 날짜들의 기록 생성(백필)을 진행

## 참고

- 같은 날짜를 여러 번 보내면 마지막 전송으로 대체됩니다 (중복 기록 없음)
- Garmin 활동이 있는 날은 두 소스가 합쳐집니다 (7/8 이전 Garmin, 7/9 이후 Apple)
- 사진 단축어(20:50)와 별개입니다 — 둘 다 설정하세요 ([PHOTO_AUTO_SELECT_GUIDE.md](PHOTO_AUTO_SELECT_GUIDE.md))
