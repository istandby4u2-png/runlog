# 브라우저 콘솔 사용 가이드

## 브라우저 콘솔이란?
브라우저 콘솔은 웹사이트의 JavaScript 코드를 실행하고 디버깅할 수 있는 도구입니다.

## 단계별 사용 방법

### 1단계: 개발자 도구 열기

#### Chrome / Edge (Windows/Linux)
- `F12` 키 누르기
- 또는 `Ctrl + Shift + I`
- 또는 마우스 우클릭 → "검사" 또는 "Inspect"

#### Chrome / Edge (Mac)
- `Cmd + Option + I`
- 또는 `F12` 키 (일부 Mac에서는 `Fn + F12`)
- 또는 마우스 우클릭 → "검사" 또는 "Inspect"

#### Safari (Mac)
- 먼저 개발자 메뉴 활성화 필요:
  1. Safari → 환경설정 → 고급
  2. "메뉴 막대에서 개발자용 메뉴 보기" 체크
- 그 다음 `Cmd + Option + C`

#### Firefox
- `F12` 키
- 또는 `Ctrl + Shift + I` (Windows/Linux)
- 또는 `Cmd + Option + I` (Mac)

### 2단계: Console 탭 찾기

개발자 도구가 열리면 상단에 여러 탭이 보입니다:
- **Elements** (또는 Inspector)
- **Console** ← 이 탭을 클릭하세요!
- **Network**
- **Sources**
- 등등

**Console** 탭을 클릭하세요.

### 3단계: 콘솔 입력란 찾기

Console 탭을 열면:
- 하단에 입력란(프롬프트)이 보입니다
- `>` 기호가 보이면 그곳이 입력란입니다
- 또는 "Console" 영역 하단의 텍스트 입력 필드

### 4단계: 코드 입력하기

1. 입력란을 클릭하여 커서를 둡니다
2. 다음 코드를 복사해서 붙여넣습니다:

```javascript
fetch('/api/calories', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ meal: '치킨 한 마리, 콜라 500ml' })
})
  .then(r => r.json())
  .then(data => console.log('결과:', data))
  .catch(err => console.error('오류:', err))
```

3. **Enter** 키를 누릅니다

### 5단계: 결과 확인

입력란 아래에 결과가 표시됩니다:
- 성공: `결과: { calories: 1200 }` 같은 메시지
- 실패: `오류: ...` 같은 에러 메시지

## 시각적 가이드

```
┌─────────────────────────────────────┐
│  Elements | Console | Network | ... │ ← 탭 선택
├─────────────────────────────────────┤
│                                     │
│  >                                   │ ← 입력란 (여기에 코드 입력)
│                                     │
│  결과: { calories: 1200 }           │ ← 결과 표시
│                                     │
└─────────────────────────────────────┘
```

## 팁

### 여러 줄 코드 입력
- 여러 줄 코드를 입력할 때는 `Shift + Enter`로 줄바꿈
- 입력 완료 후 `Enter`로 실행

### 이전 명령어 다시 사용
- 위/아래 화살표 키로 이전 명령어 불러오기

### 콘솔 지우기
- `Cmd + K` (Mac) 또는 `Ctrl + L` (Windows/Linux)
- 또는 콘솔 영역에서 우클릭 → "Clear console"

## 칼로리 계산 테스트 코드

### 간단한 테스트
```javascript
fetch('/api/calories', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ meal: '치킨 한 마리' })
}).then(r => r.json()).then(console.log)
```

### 상세한 테스트
```javascript
fetch('/api/calories', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ meal: '돼지고기 수육 500g, 김치 한 접시, 맥주 300cc' })
})
  .then(response => {
    console.log('응답 상태:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('응답 데이터:', data);
    if (data.calories) {
      console.log('✅ 칼로리:', data.calories, 'kcal');
    } else {
      console.error('❌ 오류:', data.error);
    }
  })
  .catch(error => {
    console.error('❌ 네트워크 오류:', error);
  });
```

## 문제 해결

### 콘솔이 안 보여요
- 개발자 도구가 열려있는지 확인
- Console 탭이 선택되어 있는지 확인
- 브라우저를 새로고침하고 다시 시도

### 코드를 입력했는데 아무 일도 안 일어나요
- `Enter` 키를 눌렀는지 확인
- 여러 줄 코드인 경우 마지막 줄에서 `Enter` 누르기
- 코드에 오타가 없는지 확인

### 에러가 나와요
- 에러 메시지를 읽어보세요
- 서버가 실행 중인지 확인
- Network 탭에서 요청이 전송되었는지 확인

## 스크린샷으로 확인하는 방법

1. 개발자 도구 열기 (F12)
2. Console 탭 클릭
3. 코드 입력
4. Enter 키 누르기
5. 결과 확인

이 과정을 스크린샷으로 찍어서 보여주시면 더 정확히 도와드릴 수 있습니다!
