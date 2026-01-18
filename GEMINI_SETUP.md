# Gemini API 설정 가이드

## 개요

러닝 기록 입력 시 식사 내용을 입력하면 Gemini API를 사용하여 자동으로 칼로리를 계산합니다.

## Gemini API 키 발급

### 1. Google AI Studio 접속

1. [Google AI Studio](https://makersuite.google.com/app/apikey) 접속
2. Google 계정으로 로그인

### 2. API 키 생성

1. **Create API Key** 버튼 클릭
2. 프로젝트 선택 또는 새 프로젝트 생성
3. 생성된 API 키 복사

### 3. 환경 변수 설정

`.env` 파일에 다음을 추가하세요:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

⚠️ **주의**: `.env` 파일은 절대 Git에 커밋하지 마세요!

## 비용 정보

### 무료 할당량
- **Gemini Pro**: 월 60회 무료 요청
- 일반적인 사용량에서는 무료로 사용 가능

### 과금 기준
- 무료 할당량 초과 시 요청당 과금
- 자세한 가격은 [Google AI Studio 가격 페이지](https://ai.google.dev/pricing) 참고

## 사용 방법

1. 기록 등록 페이지에서 "러닝 전 식사" 입력란에 식사 내용 입력
   - 예: "돼지고기 수육 500g, 김치 한 접시, 깻잎, 청양고추, 와사비, 맥주 300cc"
2. 입력 후 자동으로 칼로리 계산
3. 계산된 칼로리가 표시됨
4. 기록 저장 시 식사와 칼로리 정보가 함께 저장됨

## 문제 해결

### API 키 오류
- **에러**: "GEMINI_API_KEY가 설정되지 않았습니다"
- **해결**: `.env` 파일에 `GEMINI_API_KEY` 추가

### 칼로리 계산 실패
- **에러**: "칼로리 계산에 실패했습니다"
- **해결**: 
  1. API 키가 올바른지 확인
  2. 네트워크 연결 확인
  3. Gemini API 할당량 확인

### 계산 결과가 부정확한 경우
- Gemini API는 AI 기반이므로 완벽하지 않을 수 있습니다
- 대략적인 칼로리 추정치로 참고하세요

## 참고 자료

- [Google AI Studio](https://makersuite.google.com/)
- [Gemini API 문서](https://ai.google.dev/docs)
- [Gemini API 가격](https://ai.google.dev/pricing)
