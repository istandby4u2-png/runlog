'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Image as ImageIcon, Loader2, X, ExternalLink } from 'lucide-react';

export type GooglePhotosPickerProps = {
  onFileReady: (file: File) => void | Promise<void>;
  onError?: (message: string) => void;
  disabled?: boolean;
  className?: string;
};

/**
 * Google Photos Picker using the new Picker API (photospicker.mediaitems.readonly).
 * Creates a server-side session, opens the Google Photos picker in a new tab,
 * polls for completion, then downloads the selected photo.
 */
export function GooglePhotosPicker({
  onFileReady,
  onError,
  disabled,
  className = '',
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
      const today = new Date(
        new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' })
      ).toISOString().slice(0, 10);

      const res = await fetch('/api/photos/picker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: today }),
      });
      const text = await res.text();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(`서버 응답 오류 (${res.status})`);
      }
      if (!res.ok) throw new Error(data.error || 'Session 생성 실패');

      sessionRef.current = data.sessionId;
      setPickerUri(data.pickerUri);
      window.open(data.pickerUri, '_blank');

      pollingRef.current = setInterval(async () => {
        try {
          const pollRes = await fetch(
            `/api/photos/picker?sessionId=${sessionRef.current}&date=${today}`
          );
          const pollText = await pollRes.text();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let pollData: any;
          try {
            pollData = JSON.parse(pollText);
          } catch {
            return;
          }

          if (pollData.status === 'done' && pollData.blobUrl) {
            cleanup();
            setLoading(false);
            try {
              const imgRes = await fetch(pollData.blobUrl);
              const blob = await imgRes.blob();
              const file = new File([blob], `google-photo-${Date.now()}.jpg`, {
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
            setPickerError(pollData.error);
          }
        } catch {
          // keep polling
        }
      }, 3000);
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
