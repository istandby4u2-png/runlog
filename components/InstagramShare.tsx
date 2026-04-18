'use client';

import { RunningRecord } from '@/types';
import { Instagram } from 'lucide-react';
import { emojiToTwemojiSvgStem } from '@/lib/twemoji-stem';
import { recolorTwemojiSvgString } from '@/lib/twemoji-recolor-for-card';
import {
  formatInstagramCalendarDate,
  stravaSportTypeEmoji,
} from '@/lib/strava-api';

interface InstagramShareProps {
  record: RunningRecord;
}

/** 수기 기록은 Run — 서버 카드와 동일 Twemoji(러닝女) */
async function drawTwemojiSportCanvas(
  ctx: CanvasRenderingContext2D,
  sportType: string,
  cx: number,
  cy: number,
  size: number
): Promise<void> {
  const stem = emojiToTwemojiSvgStem(stravaSportTypeEmoji(sportType));
  const res = await fetch(`/twemoji/${stem}.svg`);
  if (!res.ok) throw new Error('twemoji fetch');
  const raw = await res.text();
  const svg = recolorTwemojiSvgString(stem, raw);
  const img = new Image();
  img.decoding = 'async';
  img.crossOrigin = 'anonymous';
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('twemoji sport'));
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
  ctx.save();
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.drawImage(img, cx - size / 2, cy - size / 2, size, size);
  ctx.restore();
}

export function InstagramShare({ record }: InstagramShareProps) {
  const generateInstagramImage = async () => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1080;
      canvas.height = 1080;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        alert('Canvas를 생성할 수 없습니다.');
        return;
      }

      const imageUrl = record.image_url;
      if (imageUrl) {
        const bgImg = new Image();
        bgImg.crossOrigin = 'anonymous';

        await new Promise((resolve, reject) => {
          bgImg.onload = () => {
            try {
              const imgAspect = bgImg.width / bgImg.height;
              const canvasAspect = 1080 / 1080;

              let drawWidth: number;
              let drawHeight: number;
              let drawX: number;
              let drawY: number;

              if (imgAspect > canvasAspect) {
                drawHeight = 1080;
                drawWidth = bgImg.width * (1080 / bgImg.height);
                drawX = (1080 - drawWidth) / 2;
                drawY = 0;
              } else {
                drawWidth = 1080;
                drawHeight = bgImg.height * (1080 / bgImg.width);
                drawX = 0;
                drawY = (1080 - drawHeight) / 2;
              }

              ctx.drawImage(bgImg, drawX, drawY, drawWidth, drawHeight);

              ctx.fillStyle = 'rgba(0, 0, 0, 0.48)';
              ctx.fillRect(0, 0, 1080, 1080);

              resolve(null);
            } catch (error) {
              reject(error);
            }
          };
          bgImg.onerror = () => {
            const gradient = ctx.createLinearGradient(0, 0, 1080, 1080);
            gradient.addColorStop(0, '#1a1a1a');
            gradient.addColorStop(1, '#4a4a4a');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 1080, 1080);
            resolve(null);
          };
          bgImg.src = imageUrl;
        });
      } else {
        const gradient = ctx.createLinearGradient(0, 0, 1080, 1080);
        gradient.addColorStop(0, '#1a1a1a');
        gradient.addColorStop(1, '#4a4a4a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1080, 1080);
      }

      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
      ctx.shadowBlur = 14;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2;

      try {
        await drawTwemojiSportCanvas(ctx, 'Run', 540, 360, 108);
      } catch {
        ctx.save();
        ctx.shadowBlur = 0;
        ctx.font =
          '108px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(stravaSportTypeEmoji('Run'), 540, 400);
        ctx.restore();
      }

      const distPart =
        record.distance != null && record.distance > 0
          ? `${Number(record.distance).toFixed(2)} km`
          : '';
      let durPart = '';
      if (record.duration != null && record.duration > 0) {
        const totalM = Math.max(0, Math.round(record.duration));
        const h = Math.floor(totalM / 60);
        const m = totalM % 60;
        durPart = h <= 0 ? `${m}m` : m > 0 ? `${h}h ${m}m` : `${h}h`;
      }
      const metrics = [distPart, durPart].filter(Boolean).join(' · ');
      if (metrics) {
        ctx.font =
          'bold 40px "Apple SD Gothic Neo", "AppleGothic", "Malgun Gothic", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(metrics, 540, 500);
      }

      ctx.font =
        '600 26px "Apple SD Gothic Neo", "AppleGothic", "Malgun Gothic", sans-serif';
      ctx.fillStyle = '#f2f2f2';
      ctx.shadowBlur = 10;
      ctx.fillText(
        formatInstagramCalendarDate(record.record_date),
        540,
        548
      );

      try {
        await document.fonts.load('400 42px "Dancing Script"');
      } catch {
        /* ignore */
      }
      ctx.shadowBlur = 10;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '400 42px "Dancing Script", cursive';
      ctx.fillStyle = 'rgba(255,255,255,0.98)';
      ctx.fillText('RunLog', 540, 1032);

      canvas.toBlob((blob) => {
        if (!blob) {
          alert('이미지 생성에 실패했습니다.');
          return;
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `runlog-${record.id}-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        if (navigator.share) {
          const cal = formatInstagramCalendarDate(record.record_date);
          const textLines = [
            record.title,
            cal,
            record.distance != null && record.distance > 0
              ? `거리: ${Number(record.distance).toFixed(2)} km`
              : '',
            record.duration != null && record.duration > 0
              ? `시간: ${(() => {
                  const h = Math.floor(record.duration / 60);
                  const m = record.duration % 60;
                  return h > 0 ? `${h}시간 ${m}분` : `${m}분`;
                })()}`
              : '',
            record.content?.trim() || '',
          ].filter(Boolean);
          const shareData = {
            title: record.title,
            text: textLines.join('\n'),
            files: [new File([blob], `runlog-${record.id}.png`, { type: 'image/png' })],
          };

          navigator.share(shareData).catch((error) => {
            console.log('공유 실패:', error);
          });
        }
      }, 'image/png');
    } catch (error) {
      console.error('Instagram 이미지 생성 실패:', error);
      alert('이미지 생성 중 오류가 발생했습니다.');
    }
  };

  return (
    <button
      onClick={generateInstagramImage}
      className="flex items-center gap-2 px-3 py-1.5 bg-white border border-black text-black rounded hover:bg-black hover:text-white transition-colors text-sm"
      title="Generate image for Instagram"
    >
      <Instagram size={16} />
      <span>for Instagram</span>
    </button>
  );
}
