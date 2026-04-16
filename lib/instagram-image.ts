import fs from 'node:fs';
import path from 'node:path';
import satori from 'satori';
import sharp from 'sharp';
import { stravaSportTypeEmoji } from '@/lib/strava-api';

/**
 * 배포(Vercel)에서도 한글·이모지 글리프가 빠지지 않도록 WOFF는 `public/fonts/instagram-card` 우선.
 * (node_modules만 쓰면 output tracing 누락 시 □로 렌더링될 수 있음)
 */
const PUBLIC_CARD_FONTS = path.join(
  process.cwd(),
  'public',
  'fonts',
  'instagram-card'
);

const NOTO_KR_FILES = path.join(
  process.cwd(),
  'node_modules',
  '@fontsource',
  'noto-sans-kr',
  'files'
);

const NOTO_EMOJI_FILES = path.join(
  process.cwd(),
  'node_modules',
  '@fontsource',
  'noto-color-emoji',
  'files'
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
  const fallback = filename.includes('emoji')
    ? path.join(NOTO_EMOJI_FILES, filename)
    : path.join(NOTO_KR_FILES, filename);
  const fp = fs.existsSync(pub) ? pub : fallback;
  const buf = fs.readFileSync(fp);
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

function getNotoColorEmojiFont(): SatoriFontConfig {
  if (cachedEmojiFont) return cachedEmojiFont;
  cachedEmojiFont = {
    name: 'NotoColorEmoji',
    data: readFontFile('noto-color-emoji-emoji-400-normal.woff'),
    weight: 400,
    style: 'normal',
  };
  return cachedEmojiFont;
}

function getNotoSansKRSatoriFonts(): SatoriFontConfig[] {
  if (cachedSatoriFonts) return cachedSatoriFonts;
  const weights = [400, 600, 700] as const;
  const fonts: SatoriFontConfig[] = [];
  for (const w of weights) {
    fonts.push({
      name: 'NotoSansKR',
      data: readFontFile(`noto-sans-kr-latin-${w}-normal.woff`),
      weight: w,
      style: 'normal',
    });
    fonts.push({
      name: 'NotoSansKR',
      data: readFontFile(`noto-sans-kr-korean-${w}-normal.woff`),
      weight: w,
      style: 'normal',
    });
  }
  cachedSatoriFonts = fonts;
  return fonts;
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

function cardFonts(): SatoriFontConfig[] {
  return [...getNotoSansKRSatoriFonts(), getNotoColorEmojiFont()];
}

const W = 1080;
const H = 1080;

/** 참고 UI: 2026.3.9 */
function formatCardDateYMD(isoDate: string): string {
  const d = isoDate.slice(0, 10);
  const m = d.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return d.replace(/-/g, '.');
  const y = m[1];
  const mo = Number(m[2]);
  const day = Number(m[3]);
  return `${y}.${mo}.${day}`;
}

function formatDurationLine(minutes: number): string {
  if (minutes <= 0) return '';
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  if (h <= 0) return `${m}분`;
  return `${h}시간 ${m}분`;
}

function truncateText(s: string, maxLen: number): string {
  if (s.length <= maxLen) return s;
  return `${s.slice(0, Math.max(0, maxLen - 1))}…`;
}

/**
 * Generate a 1080x1080 JPEG running summary card for Instagram.
 * 사진 배경 + 어두운 오버레이 + 가운데 정렬 텍스트 (참고 스크린과 유사).
 */
export async function generateInstagramCard(
  activity: ActivityData | ActivityData[],
  backgroundPhoto?: Buffer | null
): Promise<Buffer> {
  const list = Array.isArray(activity) ? activity : [activity];
  const primary = list[0];
  const dateStr = formatCardDateYMD(
    primary.startTimeLocal
      ? primary.startTimeLocal.slice(0, 10)
      : new Date().toISOString().slice(0, 10)
  );

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
        bottom: 48,
        left: 0,
        right: 0,
        fontSize: 44,
        fontWeight: 700,
        ...textBase,
        letterSpacing: 2,
      },
      children: 'RunLog',
    },
  };

  /* eslint-disable @typescript-eslint/no-explicit-any */
  let children: any[];

  if (list.length === 1) {
    const a = list[0];
    const emoji = stravaSportTypeEmoji(a.sportType || 'Run');
    const distLine =
      a.distanceKm > 0 ? `${(Math.round(a.distanceKm * 100) / 100).toFixed(2)}km` : '';
    const durLine = formatDurationLine(a.durationMinutes);

    children = [
      {
        type: 'div',
        props: {
          style: {
            fontSize: 88,
            fontFamily: 'NotoColorEmoji',
            fontWeight: 400,
            lineHeight: 1,
            textAlign: 'center',
          },
          children: emoji,
        },
      },
      {
        type: 'div',
        props: {
          style: {
            fontSize: 64,
            fontWeight: 700,
            marginTop: 28,
            ...textBase,
            textShadow: '0 2px 12px rgba(0,0,0,0.45)',
          },
          children: dateStr,
        },
      },
      ...(distLine
        ? [
            {
              type: 'div',
              props: {
                style: {
                  fontSize: 46,
                  fontWeight: 600,
                  marginTop: 20,
                  ...textBase,
                  textShadow: '0 2px 10px rgba(0,0,0,0.4)',
                },
                children: distLine,
              },
            },
          ]
        : []),
      ...(durLine
        ? [
            {
              type: 'div',
              props: {
                style: {
                  fontSize: 42,
                  fontWeight: 400,
                  marginTop: 12,
                  ...textBase,
                  color: '#f0f0f0',
                  textShadow: '0 2px 10px rgba(0,0,0,0.4)',
                },
                children: durLine,
              },
            },
          ]
        : []),
      {
        type: 'div',
        props: {
          style: {
            fontSize: 40,
            fontWeight: 600,
            marginTop: 28,
            maxWidth: '90%',
            lineHeight: 1.35,
            ...textBase,
            textShadow: '0 2px 10px rgba(0,0,0,0.45)',
          },
          children: truncateText(a.activityName || 'Activity', 80),
        },
      },
      runlogFooter,
    ];
  } else {
    const totalKm = list.reduce((s, x) => s + (x.distanceKm || 0), 0);
    const maxRows = 5;
    const rows = list.slice(0, maxRows);
    const more = list.length > maxRows ? list.length - maxRows : 0;

    children = [
      {
        type: 'div',
        props: {
          style: {
            fontSize: 52,
            fontWeight: 700,
            ...textBase,
            maxWidth: '92%',
            textShadow: '0 2px 12px rgba(0,0,0,0.45)',
          },
          children: `활동 ${list.length}건`,
        },
      },
      {
        type: 'div',
        props: {
          style: {
            fontSize: 40,
            fontWeight: 600,
            marginTop: 14,
            ...textBase,
            textShadow: '0 2px 10px rgba(0,0,0,0.4)',
          },
          children: `총 ${totalKm.toFixed(1)}km`,
        },
      },
      {
        type: 'div',
        props: {
          style: {
            fontSize: 36,
            fontWeight: 400,
            marginTop: 10,
            ...textBase,
            color: '#eeeeee',
            textShadow: '0 2px 8px rgba(0,0,0,0.35)',
          },
          children: dateStr,
        },
      },
      ...rows.map((act, i) => {
        const rowEmoji = stravaSportTypeEmoji(act.sportType || 'Run');
        const dur = formatDurationLine(act.durationMinutes);
        const parts = [
          `${i + 1}. ${truncateText(act.activityName, 22)}`,
          act.distanceKm > 0 ? `${act.distanceKm}km` : '',
          dur,
        ].filter(Boolean);
        const line = parts.join(' · ');
        return {
          type: 'div',
          props: {
            style: {
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: i === 0 ? 22 : 10,
              maxWidth: '94%',
              gap: 10,
              flexWrap: 'wrap' as const,
            },
            children: [
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: 30,
                    fontFamily: 'NotoColorEmoji',
                    fontWeight: 400,
                    lineHeight: 1.1,
                    flexShrink: 0,
                  },
                  children: rowEmoji,
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: 26,
                    fontWeight: 400,
                    fontFamily: 'NotoSansKR',
                    color: 'white',
                    textAlign: 'center',
                    lineHeight: 1.3,
                    maxWidth: '86%',
                    textShadow: '0 1px 8px rgba(0,0,0,0.4)',
                  },
                  children: line,
                },
              },
            ],
          },
        };
      }),
      ...(more > 0
        ? [
            {
              type: 'div',
              props: {
                style: {
                  fontSize: 26,
                  fontWeight: 400,
                  fontFamily: 'NotoSansKR',
                  marginTop: 12,
                  color: '#e8e8e8',
                  textAlign: 'center',
                  textShadow: '0 1px 6px rgba(0,0,0,0.35)',
                },
                children: `외 ${more}건`,
              },
            },
          ]
        : []),
      runlogFooter,
    ];
  }

  const element = {
    type: 'div',
    props: {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 40,
        paddingBottom: 120,
        paddingLeft: 36,
        paddingRight: 36,
        backgroundColor: 'rgba(0,0,0,0.5)',
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
