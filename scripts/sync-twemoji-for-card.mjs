#!/usr/bin/env node
/**
 * Instagram 카드용 Twemoji — stravaSportTypeEmoji()가 쓰는 그림만 public/twemoji 에 고정.
 * CDN은 런타임에 쓰지 않으므로, 빌드/클론 시 이 스크립트로 채움.
 *
 * 사용: node scripts/sync-twemoji-for-card.mjs
 * 강제 덮어쓰기: TWEMOJI_FORCE=1 node scripts/sync-twemoji-for-card.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'public', 'twemoji');
const CDN =
  'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg';

function emojiToTwemojiSvgStem(emoji) {
  const r = [];
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

/** lib/strava-api stravaSportTypeEmoji 반환 집합과 동기화 */
const REQUIRED_EMOJIS = ['🚶🏻‍♀️', '🏃🏻‍♀️', '🚲', '💪'];

const force = process.env.TWEMOJI_FORCE === '1';

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  for (const em of REQUIRED_EMOJIS) {
    const stem = emojiToTwemojiSvgStem(em);
    const file = path.join(OUT, `${stem}.svg`);
    if (fs.existsSync(file) && fs.statSync(file).size > 0 && !force) {
      console.log(`ok (cached) ${stem}.svg`);
      continue;
    }
    const url = `${CDN}/${stem}.svg`;
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`fetch failed ${res.status} ${url}`);
      process.exit(1);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(file, buf);
    console.log(`wrote ${stem}.svg`);
  }
  console.log('twemoji: done');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
