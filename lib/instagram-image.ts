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

function formatPace(minPerKm: number | null): string {
  if (!minPerKm || minPerKm <= 0) return '';
  const mins = Math.floor(minPerKm);
  const secs = Math.round((minPerKm - mins) * 60);
  return `${mins}'${secs.toString().padStart(2, '0')}"`;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/**
 * Generate a 1080x1080 JPEG running summary card for Instagram.
 *
 * Uses sharp's SVG overlay approach: render text as SVG, composite onto
 * a background (either provided photo buffer, or solid gradient).
 */
export async function generateInstagramCard(
  activity: ActivityData,
  backgroundPhoto?: Buffer | null
): Promise<Buffer> {
  const dateStr = activity.startTimeLocal
    ? activity.startTimeLocal.slice(0, 10).replace(/-/g, '.')
    : new Date().toISOString().slice(0, 10).replace(/-/g, '.');

  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="rgba(0,0,0,0.35)"/>
  <text x="540" y="480" text-anchor="middle" font-size="80" font-weight="bold" fill="white" font-family="sans-serif">${escapeXml(activity.activityName)}</text>
  <text x="540" y="560" text-anchor="middle" font-size="52" fill="#e0e0e0" font-family="sans-serif">${escapeXml(dateStr)}</text>
  <text x="540" y="1020" text-anchor="middle" font-size="40" font-weight="bold" fill="white" font-family="serif" font-style="italic">RunLog</text>
</svg>`;

  let base: sharp.Sharp;

  if (backgroundPhoto && backgroundPhoto.length > 0) {
    base = sharp(backgroundPhoto)
      .resize(W, H, { fit: 'cover', position: 'centre' })
      .jpeg();
  } else {
    // Dark gradient fallback
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
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .jpeg({ quality: 90 })
    .toBuffer();

  return result;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
