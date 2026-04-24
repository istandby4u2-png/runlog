'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Image as ImageIcon, Loader2, X, ExternalLink } from 'lucide-react';

function kstTodayYmd(): string {
  return new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' })
  )
    .toISOString()
    .slice(0, 10);
}

/** YYYY-MM-DD만 허용, 그 외에는 KST 오늘 */
function resolvePickerDate(dateProp?: string): string {
  const s = dateProp?.trim().slice(0, 10) ?? '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return kstTodayYmd();
}

export type GooglePhotosPickerProps = {
  onFileReady: (file: File) => void | Promise<void>;
  onError?: (message: string) => void;
  /** Google 토큰이 취소·만료되어 서버가 연결을 지운 뒤 — 예: Settings 연결 상태 refetch */
  onGoogleConnectionInvalid?: () => void | Promise<void>;
  disabled?: boolean;
  className?: string;
  /** picked_photos·세션에 쓰는 날짜 (기록 수정 시 record_date 등). 없으면 KST 오늘 */
  date?: string;
};

/**
 * Google Photos Picker using the new Picker API (photospicker.mediaitems.readonly).
 * Creates a server-side session, opens the Google Photos picker in a new tab,
 * polls for completion, then downloads the selected photo.
 */
export function GooglePhotosPicker({
  onFileReady,
  onError,
  onGoogleConnectionInvalid,
  disabled,
  className = '',
  date: dateProp,
}: GooglePhotosPickerProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pickerUri, setPickerUri] = useState<string | null>(null);
  const [pickerError, setPickerError] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionRef = useRef<string | null>(null);

  const cleanup = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const handleOpen = async () => {
    setOpen(true);
    setLoading(true);
    setPickerError(null);
    setPickerUri(null);

    try {
      const photoDate = resolvePickerDate(dateProp);

      const res = await fetch('/api/photos/picker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ date: photoDate }),
      });
      const text = await res.text();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`서버 응답 오류 (${res.status})`);
      }
      if (!res.ok) {
        if (data.reconnect) void onGoogleConnectionInvalid?.();
        throw new Error(data.error || 'Session 생성 실패');
      }

      const sessionId = data.sessionId;
      if (typeof sessionId !== 'string' || !sessionId.trim()) {
        throw new Error('세션 ID를 받지 못했습니다.');
      }
      sessionRef.current = sessionId;
      setPickerUri(data.pickerUri);
      window.open(data.pickerUri, '_blank');

      pollingRef.current = setInterval(async () => {
        try {
          const pollRes = await fetch(
            `/api/photos/picker?sessionId=${encodeURIComponent(sessionId)}&date=${encodeURIComponent(photoDate)}`,
            { credentials: 'include' }
          );
          const pollText = await pollRes.text();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let pollData: any;
          try {
            pollData = JSON.parse(pollText);
          } catch {
            if (!pollRes.ok) {
              cleanup();
              setLoading(false);
              const msg = `서버 응답 오류 (${pollRes.status})`;
              setPickerError(msg);
              onError?.(msg);
            }
            return;
          }

          if (!pollRes.ok) {
            cleanup();
            setLoading(false);
            if (pollData?.reconnect) void onGoogleConnectionInvalid?.();
            const msg =
              typeof pollData?.error === 'string'
                ? pollData.error
                : `서버 오류 (${pollRes.status})`;
            setPickerError(msg);
            onError?.(msg);
            return;
          }

          if (pollData.status === 'done' && pollData.blobUrl) {
            cleanup();
            setLoading(false);
            try {
              // Supabase/Vercel Blob URL은 브라우저 직접 fetch 시 CORS로 실패하는 경우가 있어 동일 출처 프록시 사용
              const imgRes = await fetch('/api/photos/fetch-picked', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: pollData.blobUrl }),
              });
              if (!imgRes.ok) {
                let errMsg = `사진을 가져오지 못했습니다. (${imgRes.status})`;
                try {
                  const errJson = await imgRes.json();
                  if (typeof errJson?.error === 'string') errMsg = errJson.error;
                } catch {
                  /* ignore */
                }
                throw new Error(errMsg);
              }
              const blob = await imgRes.blob();
              const ext =
                blob.type === 'image/png'
                  ? 'png'
                  : blob.type === 'image/webp'
                    ? 'webp'
                    : blob.type === 'image/gif'
                      ? 'gif'
                      : 'jpg';
              const file = new File([blob], `google-photo-${Date.now()}.${ext}`, {
                type: blob.type || 'image/jpeg',
              });
              await onFileReady(file);
              setOpen(false);
            } catch (e: unknown) {
              const msg = e instanceof Error ? e.message : '사진을 가져오지 못했습니다.';
              setPickerError(msg);
              onError?.(msg);
            }
          } else if (pollData.status === 'empty') {
            cleanup();
            setLoading(false);
            setPickerError('사진이 선택되지 않았습니다.');
          } else if (pollData.error) {
            cleanup();
            setLoading(false);
            if (pollData.reconnect) void onGoogleConnectionInvalid?.();
            setPickerError(pollData.error);
            onError?.(pollData.error);
          }
        } catch {
          // keep polling
        }
      }, 1500);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '초기화 실패';
      setPickerError(msg);
      onError?.(msg);
      setLoading(false);
    }
  };

  const handleClose = () => {
    cleanup();
    setOpen(false);
    setPickerError(null);
    setLoading(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        className={`inline-flex items-center justify-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-800 hover:bg-gray-50 disabled:opacity-50 ${className}`}
      >
        <ImageIcon className="w-4 h-4" aria-hidden />
        Google 포토에서 선택
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="gphotos-title"
        >
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full flex flex-col p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 id="gphotos-title" className="text-lg font-semibold text-gray-900">
                Google 포토에서 선택
              </h2>
              <button
                type="button"
                onClick={handleClose}
                className="p-1 rounded hover:bg-gray-100 text-gray-600"
                aria-label="닫기"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loading && (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <Loader2 className="w-8 h-8 animate-spin mb-3" />
                <p className="text-sm">Google Photos에서 사진을 선택해주세요.</p>
                <p className="text-xs text-gray-400 mt-1">선택이 완료되면 자동으로 감지됩니다.</p>
                {pickerUri && (
                  <a
                    href={pickerUri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-sm text-blue-600 underline"
                  >
                    Google Photos 열기 <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}

            {pickerError && (
              <div className="p-3 text-sm text-red-700 bg-red-50 rounded">
                {pickerError}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
