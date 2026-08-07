import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.warn('⚠️ GEMINI_API_KEY가 설정되지 않았습니다. 칼로리 계산 기능이 작동하지 않을 수 있습니다.');
  console.warn('⚠️ .env 파일에 GEMINI_API_KEY=your_api_key 형식으로 추가해주세요.');
} else {
  console.log('✅ GEMINI_API_KEY가 설정되었습니다.');
}

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

export async function calculateCalories(mealDescription: string): Promise<number | null> {
  if (!genAI) {
    console.error('❌ Gemini AI가 초기화되지 않았습니다.');
    console.error('❌ GEMINI_API_KEY를 확인해주세요.');
    console.error('❌ .env 파일에 GEMINI_API_KEY=your_api_key 형식으로 추가하고 서버를 재시작하세요.');
    return null;
  }
  
  if (!mealDescription.trim()) {
    console.warn('⚠️ 식사 내용이 비어있습니다.');
    return null;
  }

  console.log('🔍 칼로리 계산 시작:', mealDescription);
  console.log('🔑 GEMINI_API_KEY 상태:', process.env.GEMINI_API_KEY ? `설정됨 (길이: ${process.env.GEMINI_API_KEY.length})` : '❌ 설정되지 않음');

  try {
    // 여러 모델을 순서대로 시도
    const modelOptions = [
      'gemini-2.0-flash-exp',  // 최신 모델
      'gemini-1.5-flash',      // 표준 모델
      'gemini-1.5-pro',        // 프로 모델
    ];
    
    let model;
    let modelName = '';
    let lastError;
    
    for (const modelOption of modelOptions) {
      try {
        model = genAI.getGenerativeModel({ model: modelOption });
        modelName = modelOption;
        console.log('✅ Gemini 모델 초기화 완료:', modelName);
        break;
      } catch (err: any) {
        console.warn(`⚠️ ${modelOption} 모델 실패, 다음 모델 시도...`);
        lastError = err;
      }
    }
    
    if (!model) {
      console.error('❌ 모든 모델 초기화 실패');
      throw lastError || new Error('사용 가능한 Gemini 모델이 없습니다');
    }

    const prompt = `다음 식사 내용의 총 칼로리를 정확하게 계산해주세요. 숫자만 반환해주세요 (단위 없이, 소수점 없이 정수만).

식사 내용: ${mealDescription}

예시:
- "돼지고기 수육 500g, 김치 한 접시, 깻잎, 청양고추, 와사비, 맥주 300cc" → 850
- "치킨 한 마리, 콜라 500ml" → 1200
- "밥 한 공기, 된장찌개, 김치" → 450

중요: 반드시 숫자만 반환하세요. 다른 설명이나 단위는 포함하지 마세요.`;

    console.log('📤 Gemini API 호출 시작...');
    console.log('📤 사용 모델:', modelName);
    console.log('📤 프롬프트 길이:', prompt.length);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    console.log('📥 Gemini API 호출 성공');

    console.log('📥 Gemini API 원본 응답:', text);

    // 숫자만 추출 (첫 번째 숫자만)
    const match = text.match(/\d+/);
    if (!match) {
      console.error('❌ 칼로리 계산 실패: 숫자를 찾을 수 없음. 응답:', text);
      return null;
    }

    const calories = parseFloat(match[0]);
    
    if (isNaN(calories) || calories < 0 || calories > 100000) {
      console.error('❌ 칼로리 계산 실패: 유효하지 않은 값', calories);
      return null;
    }

    console.log('✅ 칼로리 계산 성공:', calories, 'kcal');
    return Math.round(calories);
  } catch (error: any) {
    console.error('❌ Gemini API 오류 발생!');
    console.error('❌ 오류 타입:', error?.constructor?.name || typeof error);
    
    // GoogleGenerativeAI 에러의 경우 더 자세한 정보 출력
    if (error.message) {
      console.error('❌ 오류 메시지:', error.message);
    }
    if (error.status) {
      console.error('❌ HTTP 상태:', error.status);
    }
    if (error.statusText) {
      console.error('❌ HTTP 상태 텍스트:', error.statusText);
    }
    if (error.cause) {
      console.error('❌ 오류 원인:', error.cause);
    }
    if (error.stack) {
      console.error('❌ 스택 트레이스:', error.stack);
    }
    
    // GoogleGenerativeAI 특정 에러 코드 확인
    if (error.code) {
      console.error('❌ 에러 코드:', error.code);
    }
    if (error.response) {
      console.error('❌ API 응답:', JSON.stringify(error.response, null, 2));
    }
    
    console.error('❌ 전체 오류 객체:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    
    // 일반적인 에러 원인 안내
    if (error.message?.includes('API_KEY')) {
      console.error('💡 API 키 관련 오류입니다. GEMINI_API_KEY가 올바른지 확인하세요.');
    } else if (error.message?.includes('quota') || error.message?.includes('limit')) {
      console.error('💡 API 할당량 초과 또는 제한에 걸렸습니다.');
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      console.error('💡 네트워크 연결 문제일 수 있습니다.');
    }
    
    return null;
  }
}

// ---------------------------------------------------------------------------
// 사진 자동 선별 (iPhone 단축어 → auto-select 엔드포인트)
// ---------------------------------------------------------------------------

export type NaturePhotoSelection = {
  /** 선택된 사진의 0-기반 인덱스 */
  index: number;
  /** 선택 이유 (로그·응답 표시용, 한 문장) */
  reason: string;
};

/**
 * 여러 장의 사진 중 러닝 기록 카드 배경으로 좋은 «자연 사진» 1장을 Gemini Vision으로 선별.
 * 실패 시 null (호출부에서 첫 번째 사진 폴백).
 */
export async function selectNaturePhoto(
  images: { buffer: Buffer; mimeType: string }[]
): Promise<NaturePhotoSelection | null> {
  if (!genAI || images.length === 0) return null;
  if (images.length === 1) return { index: 0, reason: '사진이 1장뿐입니다.' };

  // -latest 별칭은 Google이 항상 현행 모델로 연결 (고정 버전명은 폐기되면 404)
  const modelOptions = [
    'gemini-flash-latest',
    'gemini-flash-lite-latest',
    'gemini-3-flash-preview',
  ];

  const prompt = `다음 ${images.length}장의 사진 중에서 러닝 기록 SNS 카드의 배경으로 쓸 «야외 자연 풍경» 사진 1장을 골라주세요.

가장 좋은 사진 (이런 걸 우선 선택):
- 야외 자연 풍경이 화면 대부분을 차지: 하늘, 구름, 산, 바다, 강, 호수, 나무, 숲, 공원, 들판, 길, 노을, 일출 등
- 시원하게 트인 구도로, 위에 흰 글자를 얹어도 잘 보이는 사진

절대 선택하면 안 되는 사진 (배경에 부적합):
- 음료·술·맥주·캔·병·컵·잔, 음식, 상품/제품 사진
- 신문·잡지·책·서류·문서·화면·스크린샷·텍스트가 주된 사진
- 실내 사물, 책상 위 물건, 인물이 주제인 사진

중요: 위 «절대 금지» 사진밖에 없더라도 금지 사진은 고르지 말고, 그중 **야외·하늘·초록(자연)이 조금이라도 가장 많이 보이는** 사진을 골라 그 이유를 적으세요. (맥주·신문·제품 사진은 마지막 수단으로도 피하세요.)

반드시 아래 JSON 형식으로만 답하세요. 다른 텍스트는 포함하지 마세요.
{"index": <0부터 시작하는 사진 번호>, "reason": "<선택 이유 한 문장>"}`;

  for (const modelName of modelOptions) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const parts = [
        { text: prompt },
        ...images.map((img) => ({
          inlineData: {
            data: img.buffer.toString('base64'),
            mimeType: img.mimeType,
          },
        })),
      ];
      const result = await model.generateContent(parts);
      const text = result.response.text().trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) continue;
      const parsed = JSON.parse(jsonMatch[0]) as { index?: number; reason?: string };
      if (
        typeof parsed.index === 'number' &&
        parsed.index >= 0 &&
        parsed.index < images.length
      ) {
        return {
          index: Math.floor(parsed.index),
          reason: typeof parsed.reason === 'string' ? parsed.reason : '',
        };
      }
    } catch (err) {
      console.warn(`selectNaturePhoto: ${modelName} 실패`, err instanceof Error ? err.message : err);
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// 운동 요약 이미지 판독 (피트니스 앱 공유 → ingest)
// ---------------------------------------------------------------------------

export type ExtractedWorkout = {
  /** 운동 종류 원문 (예: 실외 달리기) */
  type: string;
  distanceKm: number | null;
  durationMinutes: number | null;
  calories: number | null;
  /** 이미지에 날짜가 보이면 YYYY-MM-DD, 없으면 null */
  date: string | null;
};

/**
 * 피트니스 앱 운동 요약 이미지(공유 카드·스크린샷)에서 운동 정보를 추출.
 * 이미지에 여러 운동이 보이면 모두 반환. 실패 시 null.
 */
export async function extractWorkoutsFromImage(image: {
  buffer: Buffer;
  mimeType: string;
}): Promise<ExtractedWorkout[] | null> {
  if (!genAI) return null;

  const modelOptions = [
    'gemini-flash-latest',
    'gemini-3-flash-preview',
    'gemini-flash-lite-latest',
  ];

  const prompt = `이 이미지는 Apple 피트니스(또는 유사 앱)의 운동 기록 화면입니다.
보이는 운동 기록을 모두 추출해 JSON으로 답하세요.

규칙:
- distanceKm: 거리(km 단위 숫자). 수영이 m 표기면 km로 변환. 없으면 null
- durationMinutes: 운동 시간(분 단위 정수). "1:05:32"는 66, "34:12"는 34. 없으면 null
- calories: 활성 칼로리(kcal 정수). 없으면 null
- date: 화면에 날짜가 보이면 "YYYY-MM-DD" (연도가 없으면 2026년으로 가정). 없으면 null
- type: 화면에 표시된 운동 이름 그대로 (예: "실외 달리기")
- 요약/합계 줄은 제외하고 개별 운동만

JSON만 출력:
{"workouts":[{"type":"실외 달리기","distanceKm":12.02,"durationMinutes":66,"calories":610,"date":"2026-07-17"}]}`;

  for (const modelName of modelOptions) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent([
        { text: prompt },
        {
          inlineData: {
            data: image.buffer.toString('base64'),
            mimeType: image.mimeType,
          },
        },
      ]);
      const text = result.response.text().trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) continue;
      const parsed = JSON.parse(jsonMatch[0]) as { workouts?: ExtractedWorkout[] };
      if (Array.isArray(parsed.workouts)) {
        return parsed.workouts.filter((w) => w && typeof w.type === 'string');
      }
    } catch (err) {
      console.warn(
        `extractWorkoutsFromImage: ${modelName} 실패`,
        err instanceof Error ? err.message : err
      );
    }
  }
  return null;
}
