# 오늘 사진 자동 선택 — iPhone 단축어 설정 가이드

매일 20:50에 iPhone이 오늘 찍은 사진을 RunLog로 보내면, Gemini Vision이
자연 사진 1장을 자동 선별해 그날의 카드 배경으로 저장합니다.
(Google Photos Picker 수동 선택을 대체 — 21:00 daily-sync가 이 사진을 사용)

## 동작 방식

```
iPhone 단축어 (매일 20:50 자동 실행)
  → 오늘 찍은 사진 최대 10장을 1080px JPEG로 변환
  → POST https://runlog.life/api/photos/auto-select
  → 서버: Gemini Vision이 자연 사진 1장 선별 (하늘·산·바다·나무·노을 등)
  → EXIF 방향 보정 후 저장 → picked_photos에 오늘 날짜로 등록
  → 21:00 daily-sync가 카드 배경으로 사용
```

## 1. 단축어 만들기

단축어(Shortcuts) 앱 → `+` → 이름: **RunLog 사진 전송**

동작을 순서대로 추가:

1. **사진 검색** (Find Photos)
   - 필터 추가: `촬영일` `이(가) 오늘임`
   - 필터 추가: `미디어 유형` `이(가) 이미지임`
   - `제한` 켜기 → **10장**
2. **이미지 크기 조절** (Resize Image)
   - 이미지: `사진` (1번 결과)
   - 너비: **1080**, 높이: 자동
3. **이미지 변환** (Convert Image)
   - 이미지: `크기 조절된 이미지`
   - 포맷: **JPEG**
4. **URL 콘텐츠 가져오기** (Get Contents of URL)
   - URL: `https://runlog.life/api/photos/auto-select`
   - 방법: **POST**
   - 헤더 추가: `Authorization` = `Bearer <CRON_SECRET 값>`
     - CRON_SECRET은 Mac 터미널에서 복사: 프로젝트 폴더에서
       `grep '^CRON_SECRET=' .env.local | cut -d'"' -f2 | pbcopy`
   - 요청 본문: **양식(Form)**
   - 양식 필드 추가: 키 `photos`, 유형 **파일** → 값: `변환된 이미지` (3번 결과)
5. (선택) **알림 표시** — 내용: `URL 콘텐츠` → 선별 결과를 알림으로 확인

## 2. 매일 20:50 자동 실행

단축어 앱 → **자동화** 탭 → `+` → **개인 자동화**

- **특정 시간**: 매일, 오후 8:50
- 단축어: **RunLog 사진 전송**
- **"즉시 실행"** 선택 (확인 요청 없이 실행)

## 3. 확인 방법

- 단축어를 수동으로 한 번 실행 → 알림(또는 결과)에 JSON 응답:
  - `"ok": true, "reason": "..."` → 성공 (reason은 AI의 선택 이유)
  - `"error": ...` → 실패 사유 확인
- RunLog Settings 화면에서 오늘 날짜 사진이 등록됐는지 확인

## 참고

- 오늘 사진이 없는 날은 요청이 실패해도 무해합니다 (daily-sync는 사진 없이도
  기록 생성·게시를 진행하며 배경만 빠집니다).
- HEIC 원본도 3번 단계에서 JPEG로 변환되므로 문제 없습니다.
- 서버는 요청당 최대 10장, 장당 4MB까지 받습니다 (1080px JPEG는 보통 0.2~0.4MB).
- 수동 선택(Google Photos Picker)도 계속 사용 가능합니다 — 같은 날짜에 다시
  선택하면 덮어씁니다.
