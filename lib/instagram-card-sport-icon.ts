import { stravaSportTypeEmoji } from '@/lib/strava-api';

/** 카드 상단 스포츠 아이콘(SVG 합성용) — Noto 이모지 서브셋과 무관 */
export type SportKind = 'ride' | 'run' | 'walk' | 'strength';

export function sportKindFromEmojiChar(sportType?: string): SportKind {
  const em = stravaSportTypeEmoji(sportType || 'Run');
  if (em === '🚲') return 'ride';
  if (em === '🚶🏻‍♀️') return 'walk';
  if (em === '💪') return 'strength';
  return 'run';
}

export function pickSportKindForList(
  list: { sportType?: string }[]
): SportKind {
  for (const a of list) {
    if (sportKindFromEmojiChar(a.sportType) === 'ride') return 'ride';
  }
  for (const a of list) {
    if (sportKindFromEmojiChar(a.sportType) === 'run') return 'run';
  }
  for (const a of list) {
    if (sportKindFromEmojiChar(a.sportType) === 'walk') return 'walk';
  }
  for (const a of list) {
    if (sportKindFromEmojiChar(a.sportType) === 'strength') return 'strength';
  }
  return sportKindFromEmojiChar(list[0]?.sportType);
}

/**
 * Lucide(ISC) 실루엣 기반 흰색 스트로크 SVG — sharp 합성·캔버스 data URL 공용.
 * @see node_modules/lucide-react/dist/esm/icons/bike.js 등
 */
export function sportIconSvg(kind: SportKind): string {
  const stroke = '#000000';
  const sw = 2;
  const a = `xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="512" height="512" fill="none" stroke="${stroke}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"`;
  switch (kind) {
    case 'ride':
      return `<svg ${a}><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>`;
    case 'walk':
      return `<svg ${a}><circle cx="12" cy="5" r="1"/><path d="m9 20 3-6 3 6"/><path d="m6 8 6 2 6-2"/><path d="M12 10v4"/></svg>`;
    case 'strength':
      return `<svg ${a}><path d="m6.5 6.5 11 11"/><path d="m21 21-1-1"/><path d="m3 3 1 1"/><path d="m18 22 4-4"/><path d="m2 6 4-4"/><path d="m3 10 7-7"/><path d="m14 21 7-7"/></svg>`;
    default:
      return `<svg ${a}><path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z"/><path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z"/><path d="M16 17h4"/><path d="M4 13h4"/></svg>`;
  }
}
