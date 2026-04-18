import fs from 'node:fs';
import path from 'node:path';
import satori from 'satori';
import sharp from 'sharp';
import { stravaSportTypeEmoji } from '@/lib/strava-api';

/** Next 번들은 최상단 createRequire를 깨뜨릴 수 있음 — cwd 기준 경로만 사용 */
function notoKrFilesDir(): string {
  return path.join(
    process.cwd(),
    'node_modules',
    '@fontsource',
    'noto-sans-kr',
    'files'
  );
}

/** 배포 시 fs 추적 보강용 — 있으면 우선 사용 */
const PUBLIC_CARD_FONTS = path.join(
  process.cwd(),
  'public',
  'fonts',
  'instagram-card'
);

type SatoriFontConfig = {
  name: string;
  data: ArrayBuffer;
  weight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
  style: 'normal';
};

let cachedSatoriFonts: SatoriFontConfig[] | null = null;
let cachedEmojiFont: SatoriFontConfig | null = null;

function readFontFile(filename: string): ArrayBuffer {
  const pub = path.join(PUBLIC_CARD_FONTS, filename);
  const nm = path.join(notoKrFilesDir(), filename);
  const fp = fs.existsSync(pub) ? pub : nm;
  if (!fs.existsSync(fp)) {
    throw new Error(
      `Instagram 카드 폰트 없음: ${filename} (확인: ${pub} , ${nm})`
    );
  }
  const buf = fs.readFileSync(fp);
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

/**
 * Satori는 글리프를 폰트 배열 순서대로 찾는다.
 * 한글은 korean 서브셋을 latin보다 먼저 등록해야 □가 나오지 않는다.
 */
function getNotoSansKRSatoriFonts(): SatoriFontConfig[] {
  if (cachedSatoriFonts) return cachedSatoriFonts;
  const weights = [400, 600, 700] as const;
  const fonts: SatoriFontConfig[] = [];
  for (const w of weights) {
    fonts.push({
      name: 'NotoSansKR',
      data: readFontFile(`noto-sans-kr-korean-${w}-normal.woff`),
      weight: w,
      style: 'normal',
    });
    fonts.push({
      name: 'NotoSansKR',
      data: readFontFile(`noto-sans-kr-latin-${w}-normal.woff`),
      weight: w,
      style: 'normal',
    });
  }
  cachedSatoriFonts = fonts;
  return fonts;
}

/** 카드 상단 종목 이모지(ZWJ·피부톤) — Noto Color Emoji로 렌더 */
function getNotoColorEmojiSatoriFont(): SatoriFontConfig {
  if (cachedEmojiFont) return cachedEmojiFont;
  cachedEmojiFont = {
    name: 'NotoColorEmoji',
    data: readFontFile('noto-color-emoji-emoji-400-normal.woff'),
    weight: 400,
    style: 'normal',
  };
  return cachedEmojiFont;
}

function cardFonts(): SatoriFontConfig[] {
  return [...getNotoSansKRSatoriFonts(), getNotoColorEmojiSatoriFont()];
}

/** Strava 요약과 동일 필드 (sportType 없으면 Run 취급) */
interface ActivityData {
  activityName: string;
  sportType?: string;
  startTimeLocal: string;
  distanceKm: number;
  durationMinutes: number;
  calories: number;
  averageHR: number;
  averagePaceMinPerKm: number | null;
}

const W = 1080;
const H = 1080;

/** 카드용 시간 표기: `2h 43m` */
function formatDurationCardEn(minutes: number): string {
  if (minutes <= 0) return '';
  const totalM = Math.max(0, Math.round(minutes));
  const h = Math.floor(totalM / 60);
  const m = totalM % 60;
  if (h <= 0) return `${m}m`;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/** 여러 활동 시 카드 상단 이모지 — 자전거 등이 있으면 해당 이모지를 우선 */
function pickCardEmojiForActivities(list: ActivityData[]): string {
  const em = (t?: string) => stravaSportTypeEmoji(t || 'Run');
  for (const a of list) {
    if (em(a.sportType) === '🚲') return '🚲';
  }
  for (const a of list) {
    if (em(a.sportType) === '🏃🏻‍♀️') return '🏃🏻‍♀️';
  }
  for (const a of list) {
    if (em(a.sportType) === '🚶🏻‍♀️') return '🚶🏻‍♀️';
  }
  for (const a of list) {
    if (em(a.sportType) === '💪') return '💪';
  }
  return em(list[0]?.sportType);
}

/**
 * Instagram용 1080×1080 카드: 상단 종목 이모지, 거리·시간만, 하단 runlog.
 * 상세 문구는 캡션(buildStravaInstagramCaption)에 기재.
 */
export async function generateInstagramCard(
  activity: ActivityData | ActivityData[],
  backgroundPhoto?: Buffer | null
): Promise<Buffer> {
  const list = Array.isArray(activity) ? activity : [activity];
  const fonts = cardFonts();

  const textBase = {
    fontFamily: 'NotoSansKR',
    fontStyle: 'normal' as const,
    color: 'white',
    textAlign: 'center' as const,
  };

  const runlogFooter = {
    type: 'div',
    props: {
      style: {
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        fontSize: 44,
        fontWeight: 500,
        fontFamily: 'NotoSansKR',
        fontStyle: 'italic',
        color: 'rgba(255,255,255,0.95)',
        textAlign: 'center',
        letterSpacing: 10,
        transform: 'skewX(-10deg)',
        textShadow: '0 2px 14px rgba(0,0,0,0.5)',
      },
      children: 'runlog',
    },
  };

  /* eslint-disable @typescript-eslint/no-explicit-any */
  let mainStack: any;

  if (list.length === 1) {
    const a = list[0];
    const emojiChar = stravaSportTypeEmoji(a.sportType || 'Run');
    const distPart =
      a.distanceKm > 0 ? `${(Math.round(a.distanceKm * 100) / 100).toFixed(2)} km` : '';
    const durPart = formatDurationCardEn(a.durationMinutes);
    const metricsLine = [distPart, durPart].filter(Boolean).join(' · ');

    mainStack = {
      type: 'div',
      props: {
        style: {
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          paddingTop: 32,
          paddingBottom: 100,
        },
        children: [
          {
            type: 'div',
            props: {
              style: {
                fontSize: 176,
                fontFamily: 'NotoColorEmoji',
                lineHeight: 1,
                textAlign: 'center',
                filter: 'drop-shadow(0 6px 18px rgba(0,0,0,0.4))',
              },
              children: emojiChar,
            },
          },
          ...(metricsLine
            ? [
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: 56,
                      fontWeight: 700,
                      marginTop: 36,
                      ...textBase,
                      textShadow: '0 2px 16px rgba(0,0,0,0.55)',
                      letterSpacing: 0.5,
                    },
                    children: metricsLine,
                  },
                },
              ]
            : []),
        ],
      },
    };
  } else {
    const totalKm = list.reduce((s, x) => s + (x.distanceKm || 0), 0);
    const totalMin = list.reduce((s, x) => s + (x.durationMinutes || 0), 0);
    const emojiChar = pickCardEmojiForActivities(list);
    const distPart =
      totalKm > 0 ? `Total ${(Math.round(totalKm * 100) / 100).toFixed(2)} km` : '';
    const durPart = formatDurationCardEn(totalMin);
    const metricsLine = [distPart, durPart].filter(Boolean).join(' · ');

    mainStack = {
      type: 'div',
      props: {
        style: {
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          paddingTop: 32,
          paddingBottom: 100,
        },
        children: [
          {
            type: 'div',
            props: {
              style: {
                fontSize: 176,
                fontFamily: 'NotoColorEmoji',
                lineHeight: 1,
                textAlign: 'center',
                filter: 'drop-shadow(0 6px 18px rgba(0,0,0,0.4))',
              },
              children: emojiChar,
            },
          },
          ...(metricsLine
            ? [
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: 52,
                      fontWeight: 700,
                      marginTop: 36,
                      ...textBase,
                      textShadow: '0 2px 16px rgba(0,0,0,0.55)',
                    },
                    children: metricsLine,
                  },
                },
              ]
            : []),
          {
            type: 'div',
            props: {
              style: {
                fontSize: 30,
                fontWeight: 400,
                marginTop: 20,
                fontFamily: 'NotoSansKR',
                fontStyle: 'normal',
                color: '#e8e8e8',
                textAlign: 'center',
                textShadow: '0 2px 10px rgba(0,0,0,0.4)',
              },
              children: `${list.length} activities`,
            },
          },
        ],
      },
    };
  }

  const children: any[] = [mainStack, runlogFooter];

  const element = {
    type: 'div',
    props: {
      style: {
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
        justifyContent: 'stretch',
        backgroundColor: 'rgba(0,0,0,0.48)',
        fontFamily: 'NotoSansKR',
      },
      children,
    },
  } as any;

  const overlaySvg = await satori(element, {
    width: W,
    height: H,
    fonts,
  });

  let base: sharp.Sharp;

  if (backgroundPhoto && backgroundPhoto.length > 0) {
    base = sharp(backgroundPhoto)
      .resize(W, H, { fit: 'cover', position: 'centre' })
      .jpeg();
  } else {
    const gradientSvg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="g" cx="50%" cy="45%" r="70%">
          <stop offset="0%" stop-color="#2d2d2d"/>
          <stop offset="100%" stop-color="#0a0a0a"/>
        </radialGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#g)"/>
    </svg>`;
    base = sharp(Buffer.from(gradientSvg)).jpeg();
  }

  const result = await base
    .composite([{ input: Buffer.from(overlaySvg), top: 0, left: 0 }])
    .jpeg({ quality: 92 })
    .toBuffer();

  return result;
}
