# 러닝코스 서비스 모바일 웹사이트

러닝코스를 등록하고 공유하며, 매일의 러닝 기록을 업로드하고 다른 이용자들과 소통할 수 있는 모바일 웹사이트입니다.

## 주요 기능

- 🗺️ 구글맵을 활용한 러닝코스 그리기 및 등록
- 📝 텍스트 및 이미지 업로드 기능
- 📤 러닝코스 공유 기능
- 📊 매일의 러닝 기록 업로드 (사진, 코스, 텍스트)
- 💬 코멘트 및 좋아요 기능

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.example` 파일을 `.env`로 복사하고 필요한 값들을 설정하세요:

```bash
cp .env.example .env
```

`.env` 파일에서 다음 값들을 설정해야 합니다:
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Google Maps API 키
- `JWT_SECRET`: JWT 토큰 암호화를 위한 시크릿 키

> 📖 **Google Maps API 설정 가이드**: 자세한 설정 방법은 [GOOGLE_MAPS_SETUP.md](./GOOGLE_MAPS_SETUP.md)를 참고하세요.
> 
> **필요한 API**: Maps JavaScript API (drawing 라이브러리 포함)

### 3. 데이터베이스 초기화

데이터베이스는 자동으로 초기화됩니다. `data` 폴더가 생성되고 SQLite 데이터베이스가 설정됩니다.

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 기술 스택

- **프레임워크**: Next.js 14 (App Router)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS
- **데이터베이스**: SQLite (better-sqlite3)
- **지도**: Google Maps API
- **인증**: JWT

## 프로젝트 구조

```
├── app/                    # Next.js App Router
│   ├── api/               # API 라우트
│   ├── (auth)/            # 인증 관련 페이지
│   ├── courses/           # 코스 관련 페이지
│   ├── records/           # 러닝 기록 페이지
│   └── layout.tsx         # 루트 레이아웃
├── components/            # 재사용 가능한 컴포넌트
├── lib/                   # 유틸리티 및 데이터베이스
├── public/                # 정적 파일
└── types/                 # TypeScript 타입 정의
```

## 주요 기능 설명

### 러닝코스 등록
- Google Maps API를 사용하여 지도에 코스를 그립니다
- 코스 이름, 설명, 이미지를 추가할 수 있습니다
- 그린 경로가 자동으로 저장됩니다

### 러닝 기록
- 매일의 러닝 기록을 업로드합니다
- 사진, 사용한 코스, 텍스트를 입력할 수 있습니다
- 다른 사용자들과 공유됩니다

### 소통 기능
- 각 코스와 기록에 좋아요를 누를 수 있습니다
- 코멘트를 작성하고 다른 사용자들과 소통할 수 있습니다

## Google Maps API

이 프로젝트는 **Maps JavaScript API**를 사용합니다. 특히 다음 기능을 사용합니다:

- 지도 표시 및 상호작용
- DrawingManager를 통한 경로 그리기
- Polygon/Polyline을 통한 경로 표시

자세한 설정 방법과 비용 정보는 [GOOGLE_MAPS_SETUP.md](./GOOGLE_MAPS_SETUP.md)를 참고하세요.
