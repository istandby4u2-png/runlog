'use client';

import { RunningRecord } from '@/types';
import { Instagram, Download } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

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
              
              // 어두운 오버레이 추가 (텍스트 가독성 향상)
              ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
              ctx.fillRect(0, 0, 1080, 1080);
              
              resolve(null);
            } catch (error) {
              reject(error);
            }
          };
          bgImg.onerror = () => {
            // 이미지 로드 실패 시 그라데이션 배경 사용
            const gradient = ctx.createLinearGradient(0, 0, 1080, 1080);
            gradient.addColorStop(0, '#667eea');
            gradient.addColorStop(1, '#764ba2');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 1080, 1080);
            resolve(null);
          };
          bgImg.src = imageUrl;
        });
      } else {
        // 이미지가 없으면 그라데이션 배경
        const gradient = ctx.createLinearGradient(0, 0, 1080, 1080);
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 1080, 1080);
      }

      // 텍스트 그림자 효과를 위한 설정
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      // 제목 (Apple SD Gothic Neo)
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 80px "Apple SD Gothic Neo", "AppleGothic", "Malgun Gothic", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(record.title, 540, 220);

      // 날짜 (2025.1.17 형식)
      const date = new Date(record.record_date);
      const dateStr = `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`;
      ctx.font = '52px "Apple SD Gothic Neo", "AppleGothic", "Malgun Gothic", sans-serif';
      ctx.fillStyle = '#f0f0f0';
      ctx.fillText(dateStr, 540, 300);

      // 러닝 정보 (작은 글씨)
      let yPos = 420;
      ctx.font = '32px "Apple SD Gothic Neo", "AppleGothic", "Malgun Gothic", sans-serif';
      ctx.fillStyle = '#ffffff';

      if (record.distance) {
        ctx.fillText(`${record.distance}km`, 540, yPos);
        yPos += 50;
      }

      if (record.duration) {
        const hours = Math.floor(record.duration / 60);
        const minutes = record.duration % 60;
        const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
        ctx.fillText(timeStr, 540, yPos);
        yPos += 50;
      }

      // 날씨와 기분 (이모티콘만)
      if (record.weather || record.mood) {
        yPos += 30;
        ctx.font = '64px "Apple SD Gothic Neo", "AppleGothic", "Malgun Gothic", sans-serif';
        let emojiText = '';
        if (record.weather) {
          emojiText += record.weather;
        }
        if (record.mood) {
          emojiText += (emojiText ? ' ' : '') + record.mood;
        }
        if (emojiText) {
          ctx.fillText(emojiText, 540, yPos);
          yPos += 80;
        }
      }

      // 내용
      if (record.content) {
        yPos += 40;
        ctx.font = '40px "Apple SD Gothic Neo", "AppleGothic", "Malgun Gothic", sans-serif';
        ctx.fillStyle = '#e0e0e0';
        const lines = wrapText(ctx, record.content, 900);
        lines.forEach((line, index) => {
          ctx.fillText(line, 540, yPos + (index * 55));
        });
      }

      // 하단에 RunLog 로고
      ctx.font = '36px "Apple SD Gothic Neo", "AppleGothic", "Malgun Gothic", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('RunLog', 540, 1020);

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
          const shareData = {
            title: record.title,
            text: record.content || '',
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

  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + ' ' + word).width;
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  };

  return (
    <button
      onClick={generateInstagramImage}
      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
      title="인스타그램 스타일 이미지 생성"
    >
      <Instagram size={18} />
      <span>인스타그램 공유</span>
    </button>
  );
}
