import fs from 'node:fs';
import path from 'node:path';
import satori from 'satori';
import sharp from 'sharp';
import {
  sportIconSvg,
  sportKindFromEmojiChar,
} from '@/lib/instagram-card-sport-icon';
import { emojiToTwemojiSvgStem } from '@/lib/twemoji-stem';
import { formatDurationInstagramEn, stravaSportTypeEmoji } from '@/lib/strava-api';

/** Twemoji SVG(CC-BY 4.0): public/twemoji + CDN 폴백 — 카드에 컬러 이모지 래스터 */
const TWEMOJI_DIR = path.join(process.cwd(), 'public', 'twemoji');
const TWEMOJI_CDN =
  'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg';

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

function dancingScriptFilesDir(): string {
  return path.join(
    process.cwd(),
    'node_modules',
    '@fontsource',
    'dancing-script',
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
let cachedDancingFonts: SatoriFontConfig[] | null = null;

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

function readDancingScriptFile(filename: string): ArrayBuffer {
  const fp = path.join(dancingScriptFilesDir(), filename);
  if (!fs.existsSync(fp)) {
    throw new Error(`Dancing Script 폰트 없음: ${fp}`);
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

/** 하단 RunLog 워드마크 — 스크립트체 */
function getDancingScriptSatoriFonts(): SatoriFontConfig[] {
  if (cachedDancingFonts) return cachedDancingFonts;
  cachedDancingFonts = [
    {
      name: 'DancingScript',
      data: readDancingScriptFile('dancing-script-latin-400-normal.woff'),
      weight: 400,
      style: 'normal',
    },
    {
      name: 'DancingScript',
      data: readDancingScriptFile('dancing-script-latin-ext-400-normal.woff'),
      weight: 400,
      style: 'normal',
    },
  ];
  return cachedDancingFonts;
}

function cardFonts(): SatoriFontConfig[] {
  return [...getNotoSansKRSatoriFonts(), ...getDancingScriptSatoriFonts()];
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

const SPORT_ICON_PX = 200;
const SPORT_ICON_TOP = 300;

async function loadTwemojiSvgBytes(stem: string): Promise<Buffer | null> {
  const local = path.join(TWEMOJI_DIR, `${stem}.svg`);
  if (fs.existsSync(local)) return fs.readFileSync(local);
  try {
    const res = await fetch(`${TWEMOJI_CDN}/${stem}.svg`);
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

async function twemojiPngByStem(stem: string, size: number): Promise<Buffer | null> {
  const svg = await loadTwemojiSvgBytes(stem);
  if (!svg?.length) return null;
  return sharp(svg).resize(size, size).png().toBuffer();
}

/** Strava 종목 → Twemoji PNG, 없으면 Lucide 실루엣 */
async function rasterActivityFacePng(
  sportType: string | undefined,
  size: number
): Promise<Buffer> {
  const em = stravaSportTypeEmoji(sportType ?? 'Run');
  const stem = emojiToTwemojiSvgStem(em);
  const tw = await twemojiPngByStem(stem, size);
  if (tw) return tw;
  const kind = sportKindFromEmojiChar(sportType);
  const svg = sportIconSvg(kind);
  return sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
}

function iconSizeForActivityCount(n: number): number {
  if (n <= 1) return SPORT_ICON_PX;
  if (n === 2) return 168;
  if (n === 3) return 140;
  return 120;
}

/** 활동별 컬러 이모지(걷기·달리기 등)를 한 줄로 합성 — 복수 시 순서 유지 */
async function compositeActivityTwemojis(
  jpegBuffer: Buffer,
  list: ActivityData[]
): Promise<Buffer> {
  const n = Math.max(1, list.length);
  const size = iconSizeForActivityCount(n);
  const gap = Math.max(16, Math.round(size * 0.12));
  const pngs = await Promise.all(
    list.map((a) => rasterActivityFacePng(a.sportType, size))
  );
  const totalW = pngs.length * size + (pngs.length - 1) * gap;
  let left = Math.round((W - totalW) / 2);
  const composites = pngs.map((png) => {
    const c = { input: png, left, top: SPORT_ICON_TOP };
    left += size + gap;
    return c;
  });
  return sharp(jpegBuffer)
    .composite(composites)
    .jpeg({ quality: 92 })
    .toBuffer();
}

/** 상단 아이콘 자리(이모지 폰트 미사용 — SVG 합성용 빈 박스) */
function sportIconSpacer(): { type: string; props: Record<string, unknown> } {
  return {
    type: 'div',
    props: {
      style: {
        width: SPORT_ICON_PX,
        height: SPORT_ICON_PX,
        flexShrink: 0,
      },
    },
  };
}

/**
 * Instagram용 1080×1080 카드: 활동별 Twemoji(🚶🏻‍♀️·🏃🏻‍♀️·💪·🚲) 합성, 거리·시간, RunLog.
 * 날짜는 캡션에만 표기(이미지 미표시).
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
        bottom: 36,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        fontSize: 58,
        fontWeight: 400,
        fontFamily: 'DancingScript',
        fontStyle: 'normal',
        color: 'rgba(255,255,255,0.98)',
        textAlign: 'center',
        letterSpacing: 1,
        textShadow: '0 3px 18px rgba(0,0,0,0.55), 0 0 2px rgba(0,0,0,0.4)',
      },
      children: 'RunLog',
    },
  };

  /* eslint-disable @typescript-eslint/no-explicit-any */
  let mainStack: any;

  if (list.length === 1) {
    const a = list[0];
    const distPart =
      a.distanceKm > 0 ? `${(Math.round(a.distanceKm * 100) / 100).toFixed(2)} km` : '';
    const durPart = formatDurationInstagramEn(a.durationMinutes);
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
          sportIconSpacer(),
          ...(metricsLine
            ? [
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: 56,
                      fontWeight: 700,
                      marginTop: 28,
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
    const distPart =
      totalKm > 0 ? `Total ${(Math.round(totalKm * 100) / 100).toFixed(2)} km` : '';
    const durPart = formatDurationInstagramEn(totalMin);
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
          sportIconSpacer(),
          ...(metricsLine
            ? [
                {
                  type: 'div',
                  props: {
                    style: {
                      fontSize: 52,
                      fontWeight: 700,
                      marginTop: 28,
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
        alignItems: 'center',
        justifyContent: 'flex-start',
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

  const withOverlay = await base
    .composite([{ input: Buffer.from(overlaySvg), top: 0, left: 0 }])
    .jpeg({ quality: 92 })
    .toBuffer();

  return compositeActivityTwemojis(withOverlay, list);
}
