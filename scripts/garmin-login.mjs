#!/usr/bin/env node
/**
 * Garmin Connect OAuth 토큰 1회 발급 스크립트.
 *
 * 사용법 (터미널에서):
 *   node scripts/garmin-login.mjs
 *
 * 이메일/비밀번호를 물어보고(비밀번호는 화면에 표시되지 않음) 로그인한 뒤,
 * 토큰을 .garmin-tokens/ 디렉터리에 저장합니다. 비밀번호는 저장되지 않습니다.
 *
 * 이후 토큰을 Vercel 환경변수(GARMIN_OAUTH1_TOKEN / GARMIN_OAUTH2_TOKEN)로
 * 등록하면 프로덕션은 비밀번호 로그인 없이 토큰으로 인증합니다
 * (oauth1 토큰은 약 1년 유효, oauth2는 자동 갱신).
 *
 * 주의: 계정에 2단계 인증(MFA)이 켜져 있으면 이 스크립트는 실패합니다.
 */
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { GarminConnect } from '@flow-js/garmin-connect';

const OUT_DIR = path.join(
  path.dirname(path.dirname(fileURLToPath(import.meta.url))),
  '.garmin-tokens'
);

function ask(question, { hidden = false } = {}) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    if (hidden) {
      const onData = (char) => {
        const s = String(char);
        if (s === '\n' || s === '\r' || s === '') {
          process.stdin.removeListener('data', onData);
        } else {
          // 입력한 글자를 지워서 비밀번호가 화면에 남지 않게 함
          readline.moveCursor(process.stdout, -s.length, 0);
          process.stdout.write('*'.repeat(s.length));
        }
      };
      process.stdin.on('data', onData);
    }
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write('\n');
      resolve(answer.trim());
    });
  });
}

const defaultEmail = process.env.GARMIN_EMAIL || 'istandby4u2@gmail.com';
const email =
  (await ask(`Garmin 이메일 [${defaultEmail}]: `)) || defaultEmail;
const password = await ask('Garmin 비밀번호 (표시되지 않음): ', { hidden: true });

if (!password) {
  console.error('비밀번호가 입력되지 않았습니다.');
  process.exit(1);
}

console.log('로그인 중…');
const client = new GarminConnect({ username: email, password });
await client.login();

fs.mkdirSync(OUT_DIR, { recursive: true });
client.exportTokenToFile(OUT_DIR);
console.log(`\n로그인 성공! 토큰이 저장되었습니다: ${OUT_DIR}`);
console.log('이제 Claude에게 "토큰 발급했습니다"라고 알려주세요.');
