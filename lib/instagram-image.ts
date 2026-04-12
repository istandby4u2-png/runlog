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
  activity: ActivityData,
  backgroundPhoto?: Buffer | null
): Promise<Buffer> {
  const dateStr = activity.startTimeLocal
    ? activity.startTimeLocal.slice(0, 10).replace(/-/g, '.')
    : new Date().toISOString().slice(0, 10).replace(/-/g, '.');

  const fontData = await loadFont();

  /* eslint-disable @typescript-eslint/no-explicit-any */
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
      children: [
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
            children: activity.activityName,
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
        {
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
        },
      ],
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
