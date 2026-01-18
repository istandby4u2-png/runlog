# Google Maps API 설정 가이드

## 필요한 API

이 프로젝트에서는 **Maps JavaScript API**가 필요합니다. 특히 다음 기능을 사용합니다:

1. **지도 표시** - GoogleMap 컴포넌트
2. **경로 그리기** - DrawingManager (drawing 라이브러리)
3. **경로 표시** - Polygon, Polyline

## Google Maps API 종류 비교

### 1. Maps JavaScript API ⭐ (필수)
- **용도**: 웹 브라우저에서 인터랙티브한 지도를 표시
- **사용 예**: 지도 표시, 마커, 경로 그리기, 사용자 상호작용
- **이 프로젝트에서 사용**: ✅ 지도 표시, 경로 그리기, 경로 표시

### 2. Maps Embed API
- **용도**: 간단한 iframe으로 지도 삽입 (읽기 전용)
- **사용 예**: 정적인 지도 표시만 필요할 때
- **이 프로젝트에서 사용**: ❌ (인터랙티브 기능 필요)

### 3. Geocoding API
- **용도**: 주소 ↔ 좌표 변환
- **사용 예**: 주소 검색, 좌표로 주소 찾기
- **이 프로젝트에서 사용**: ❌ (선택사항 - 향후 주소 검색 기능 추가 시)

### 4. Directions API
- **용도**: 경로 계산 및 안내
- **사용 예**: A지점에서 B지점까지 최적 경로 계산
- **이 프로젝트에서 사용**: ❌ (사용자가 직접 경로를 그리므로 불필요)

### 5. Places API
- **용도**: 장소 검색 및 정보
- **사용 예**: "런닝 코스", "공원" 등 검색
- **이 프로젝트에서 사용**: ❌ (선택사항 - 향후 검색 기능 추가 시)

### 6. Distance Matrix API
- **용도**: 여러 지점 간 거리/시간 계산
- **사용 예**: 여러 경로의 거리 비교
- **이 프로젝트에서 사용**: ❌ (현재는 직접 계산)

## 설정 방법

### 1. Google Cloud Console에서 프로젝트 생성

1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. 결제 계정 연결 (무료 크레딧 제공)

### 2. Maps JavaScript API 활성화

1. **API 및 서비스** > **라이브러리** 메뉴로 이동
2. "Maps JavaScript API" 검색
3. **사용 설정** 클릭

### 3. API 키 생성

1. **API 및 서비스** > **사용자 인증 정보** 메뉴로 이동
2. **+ 사용자 인증 정보 만들기** > **API 키** 선택
3. 생성된 API 키 복사

### 4. API 키 제한 설정 (보안 권장)

**애플리케이션 제한사항**:
- **HTTP 리퍼러(웹사이트)** 선택
- 다음 패턴 추가:
  - `localhost:3000/*` (개발 환경)
  - `yourdomain.com/*` (프로덕션 환경)

**API 제한사항**:
- **API 키 제한** 선택
- **Maps JavaScript API**만 선택

### 5. 환경 변수 설정

`.env` 파일에 API 키 추가:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
```

⚠️ **주의**: `.env` 파일은 절대 Git에 커밋하지 마세요! (이미 .gitignore에 포함됨)

## 비용 정보

### 무료 할당량 (월간)
- **Maps JavaScript API**: 
  - 월 $200 크레딧 제공
  - 지도 로드: 월 28,000회까지 무료
  - 일반적으로 소규모 프로젝트는 무료로 사용 가능

### 과금 기준
- 지도 로드 1회당 $0.007
- 월 28,000회 초과 시 과금 시작

### 비용 절감 팁
1. **캐싱**: 같은 지도를 여러 번 로드하지 않도록 주의
2. **로딩 최적화**: 필요한 경우에만 지도 로드
3. **정적 지도 고려**: 읽기 전용인 경우 Static Maps API 사용 (더 저렴)

## 라이브러리 설정

현재 프로젝트에서는 다음 라이브러리를 사용합니다:

```typescript
const libraries: ("drawing")[] = ["drawing"];
```

- **drawing**: 사용자가 지도에 직접 경로를 그릴 수 있게 해주는 라이브러리

## 문제 해결

### API 키 오류
- **에러**: "This API key is not authorized"
- **해결**: Maps JavaScript API가 활성화되어 있는지 확인

### DrawingManager가 작동하지 않음
- **에러**: DrawingManager가 표시되지 않음
- **해결**: libraries 배열에 "drawing"이 포함되어 있는지 확인

### 지도가 표시되지 않음
- **에러**: 빈 화면만 표시
- **해결**: 
  1. 브라우저 콘솔에서 에러 확인
  2. API 키가 올바른지 확인
  3. API 키 제한 설정 확인 (localhost 허용 여부)

## 추가 기능 (선택사항)

향후 추가할 수 있는 기능과 필요한 API:

1. **주소 검색**: Geocoding API
2. **장소 검색**: Places API
3. **경로 최적화**: Directions API
4. **정적 지도 이미지**: Static Maps API (서버 사이드)

## 참고 자료

- [Maps JavaScript API 문서](https://developers.google.com/maps/documentation/javascript)
- [Drawing Library 문서](https://developers.google.com/maps/documentation/javascript/drawinglayer)
- [API 가격 정보](https://mapsplatform.google.com/pricing/)
- [React Google Maps API 문서](https://react-google-maps-api-docs.netlify.app/)
