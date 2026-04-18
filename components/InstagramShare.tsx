'use client';

import { RunningRecord } from '@/types';
import { Instagram, Download } from 'lucide-react';
// Apple SD Gothic Neo는 시스템 폰트이므로 별도 로드 불필요
// Canvas에서 직접 사용 가능

interface InstagramShareProps {
  record: RunningRecord;
}

export function InstagramShare({ record }: InstagramShareProps) {
  const generateInstagramImage = async () => {
    try {
      // Canvas 생성
      const canvas = document.createElement('canvas');
      canvas.width = 1080; // Instagram 권장 크기
      canvas.height = 1080;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        alert('Canvas를 생성할 수 없습니다.');
        return;
      }

      // 이미지가 있으면 배경으로 사용, 없으면 그라데이션 배경
      const imageUrl = record.image_url;
      if (imageUrl) {
        const bgImg = new Image();
        bgImg.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
          bgImg.onload = () => {
            try {
              // 이미지를 배경으로 전체 채우기 (비율 유지하며 크롭)
              const imgAspect = bgImg.width / bgImg.height;
              const canvasAspect = 1080 / 1080;
              
              let drawWidth, drawHeight, drawX, drawY;
              
              if (imgAspect > canvasAspect) {
                // 이미지가 더 넓음 - 높이에 맞춤
                drawHeight = 1080;
                drawWidth = bgImg.width * (1080 / bgImg.height);
                drawX = (1080 - drawWidth) / 2;
                drawY = 0;
              } else {
                // 이미지가 더 높음 - 너비에 맞춤
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
            // 이미지 로드 실패 시 그라데이션 배경 사용 (블랙&화이트)
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
        // 이미지가 없으면 그라데이션 배경 (블랙&화이트)
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

      // 카드: 종목 이모지(수기 기록은 기본 러닝) — 상세는 공유 텍스트로만
      ctx.fillStyle = '#ffffff';
      ctx.font =
        '160px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
      ctx.fillText('🏃🏻‍♀️', 540, 460);

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
          'bold 52px "Apple SD Gothic Neo", "AppleGothic", "Malgun Gothic", sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(metrics, 540, 560);
      }

      ctx.shadowBlur = 10;
      ctx.save();
      ctx.translate(540, 1028);
      ctx.transform(1, 0, -0.18, 1, 0, 0);
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font =
        'italic 500 44px "Apple SD Gothic Neo", "AppleGothic", "Malgun Gothic", sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.fillText('runlog', 0, 0);
      ctx.restore();

      // Canvas를 이미지로 변환
      canvas.toBlob((blob) => {
        if (!blob) {
          alert('이미지 생성에 실패했습니다.');
          return;
        }

        // 다운로드
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `runlog-${record.id}-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // 모바일에서 Web Share API 사용 가능하면 공유 옵션 제공
        if (navigator.share) {
          const date = new Date(record.record_date);
          const dateStr = `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`;
          const textLines = [
            record.title,
            `📅 ${dateStr}`,
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
