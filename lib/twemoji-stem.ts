/**
 * Twemoji 14.x `assets/svg/{stem}.svg` 파일명 규칙(소문자 16진, 서로게이트 병합).
 * @see https://github.com/twitter/twemoji
 */
export function emojiToTwemojiSvgStem(emoji: string): string {
  const r: string[] = [];
  let p = 0;
  let i = 0;
  while (i < emoji.length) {
    const c = emoji.charCodeAt(i++);
    if (p) {
      r.push(
        ((0x10000 + ((p - 0xd800) << 10) + (c - 0xdc00)) >>> 0).toString(16)
      );
      p = 0;
    } else if (c >= 0xd800 && c <= 0xdbff) {
      p = c;
    } else {
      r.push((c >>> 0).toString(16));
    }
  }
  return r.join('-');
}
