/**
 * Instagram 카드용: Twemoji에서 **의복·자전거 프레임 등만** 검정(#000)으로 바꾸고
 * 살색·머리카락 등은 원본 유지.
 *
 * 다른 피부톤(1f3fc 등)은 SVG 팔레트가 달라질 수 있어, 필요 시 아래 맵을 확장.
 */

/** Twemoji stem → fill(대문자 HEX) 치환: 의복·액세서리·자전거 컬러만 */
const STEM_FILL_REPLACEMENTS: Record<string, Record<string, string>> = {
  // 🏃🏻‍♀️ 러닝 — 상의·하의·신발 그레이 등
  '1f3c3-1f3fb-200d-2640-fe0f': {
    '#DD2E44': '#000000',
    '#BE1931': '#000000',
    '#A0041E': '#000000',
    '#CCD6DD': '#000000',
    '#8899A6': '#000000',
  },
  // 🚶🏻‍♀️ 워킹 — 상의 블루·가방 퍼플
  '1f6b6-1f3fb-200d-2640-fe0f': {
    '#4289C1': '#000000',
    '#2A6797': '#000000',
    '#9268CA': '#000000',
  },
  // 💪 — 소매/포인트 오렌지(팔 살색 #FFDC5D 유지)
  '1f4aa': {
    '#EF9645': '#000000',
  },
  // 🚲 — 프레임·림 컬러(타이어 #292F33, 헤드 #66757F 유지)
  '1f6b2': {
    '#DD2E44': '#000000',
    '#EA596E': '#000000',
  },
};

export function recolorTwemojiSvgString(stem: string, svg: string): string {
  const table = STEM_FILL_REPLACEMENTS[stem];
  if (!table) return svg;
  let s = svg;
  for (const [from, to] of Object.entries(table)) {
    s = s.replace(new RegExp(`fill="${from}"`, 'gi'), `fill="${to}"`);
  }
  return s;
}

export function recolorTwemojiSvgBuffer(stem: string, buf: Buffer): Buffer {
  return Buffer.from(recolorTwemojiSvgString(stem, buf.toString('utf8')), 'utf8');
}
