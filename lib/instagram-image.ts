import satori from 'satori';
import sharp from 'sharp';

interface ActivityData {
  activityName: string;
  startTimeLocal: string;
  distanceKm: number;
  durationMinutes: number;
  calories: number;
  averageHR: number;
  averagePaceMinPerKm: number | null;
}

const W = 1080;
const H = 1080;

function truncateText(s: string, maxLen: number): string {
  if (s.length <= maxLen) return s;
  return `${s.slice(0, Math.max(0, maxLen - 1))}…`;
}

const FONT_URL =
  'https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-jp@latest/japanese-400-normal.woff';

let cachedFont: ArrayBuffer | null = null;

async function loadFont(): Promise<ArrayBuffer> {
  if (cachedFont) return cachedFont;
  const res = await fetch(FONT_URL);
  if (!res.ok) throw new Error(`Font fetch failed: ${res.status}`);
  cachedFont = await res.arrayBuffer();
  return cachedFont;
}

/**
 * Generate a 1080x1080 JPEG running summary card for Instagram.
 *
 * Uses satori (text → SVG paths) + sharp (composite & JPEG encode).
 * This ensures CJK characters render correctly on any server.
 */
export async function generateInstagramCard(
  activity: ActivityData | ActivityData[],
  backgroundPhoto?: Buffer | null
): Promise<Buffer> {
  const list = Array.isArray(activity) ? activity : [activity];
  const primary = list[0];
  const dateStr = primary.startTimeLocal
    ? primary.startTimeLocal.slice(0, 10).replace(/-/g, '.')
    : new Date().toISOString().slice(0, 10).replace(/-/g, '.');

  const fontData = await loadFont();

  const runlogFooter = {
    type: 'div',
    props: {
      style: {
        position: 'absolute',
        bottom: 40,
        fontSize: 38,
        fontWeight: 700,
        color: 'white',
        fontStyle: 'italic',
      },
      children: 'RunLog',
    },
  };

  /* eslint-disable @typescript-eslint/no-explicit-any */
  let children: any[];
  if (list.length === 1) {
    const a = list[0];
    children = [
      {
        type: 'div',
        props: {
          style: {
            fontSize: 76,
            fontWeight: 700,
            color: 'white',
            textAlign: 'center',
            maxWidth: '90%',
          },
          children: a.activityName,
        },
      },
      {
        type: 'div',
        props: {
          style: {
            fontSize: 48,
            color: '#e0e0e0',
            marginTop: 16,
          },
          children: dateStr,
        },
      },
      runlogFooter,
    ];
  } else {
    const totalKm = list.reduce((s, a) => s + (a.distanceKm || 0), 0);
    const maxRows = 6;
    const rows = list.slice(0, maxRows);
    const more = list.length > maxRows ? list.length - maxRows : 0;
    children = [
      {
        type: 'div',
        props: {
          style: {
            fontSize: 56,
            fontWeight: 700,
            color: 'white',
            textAlign: 'center',
            maxWidth: '92%',
          },
          children: `활동 ${list.length}건`,
        },
      },
      {
        type: 'div',
        props: {
          style: {
            fontSize: 44,
            fontWeight: 600,
            color: '#f5f5f5',
            marginTop: 12,
            textAlign: 'center',
          },
          children: `총 ${totalKm.toFixed(1)}km`,
        },
      },
      {
        type: 'div',
        props: {
          style: {
            fontSize: 42,
            color: '#e0e0e0',
            marginTop: 10,
          },
          children: dateStr,
        },
      },
      ...rows.map((a, i) => ({
        type: 'div',
        props: {
          style: {
            fontSize: 26,
            marginTop: i === 0 ? 20 : 8,
            color: 'white',
            textAlign: 'center',
            maxWidth: '92%',
            lineHeight: 1.25,
          },
          children: `${i + 1}. ${truncateText(a.activityName, 34)} · ${a.distanceKm}km · ${a.durationMinutes}분`,
        },
      })),
      ...(more > 0
        ? [
            {
              type: 'div',
              props: {
                style: {
                  fontSize: 28,
                  marginTop: 10,
                  color: '#e8e8e8',
                  textAlign: 'center',
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
        backgroundColor: 'rgba(0,0,0,0.35)',
      },
      children,
    },
  } as any;

  const overlaySvg = await satori(element, {
    width: W,
    height: H,
    fonts: [
      {
        name: 'NotoSansJP',
        data: fontData,
        weight: 400,
        style: 'normal' as const,
      },
    ],
  });

  let base: sharp.Sharp;

  if (backgroundPhoto && backgroundPhoto.length > 0) {
    base = sharp(backgroundPhoto)
      .resize(W, H, { fit: 'cover', position: 'centre' })
      .jpeg();
  } else {
    const gradientSvg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#1a1a1a"/>
          <stop offset="100%" stop-color="#4a4a4a"/>
        </linearGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#g)"/>
    </svg>`;
    base = sharp(Buffer.from(gradientSvg)).jpeg();
  }

  const result = await base
    .composite([{ input: Buffer.from(overlaySvg), top: 0, left: 0 }])
    .jpeg({ quality: 90 })
    .toBuffer();

  return result;
}
