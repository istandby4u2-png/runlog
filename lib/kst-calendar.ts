/**
 * RFC3339 타임스탬프 → Asia/Seoul 달력 날짜 (YYYY-MM-DD)
 * Google Photos Picker `createTime` 등에 사용
 */
export function rfc3339ToKstYmd(iso: string): string | null {
  const d = new Date(iso.trim());
  if (Number.isNaN(d.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);
  const y = parts.find((p) => p.type === 'year')?.value;
  const m = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;
  if (!y || !m || !day) return null;
  return `${y}-${m}-${day}`;
}
