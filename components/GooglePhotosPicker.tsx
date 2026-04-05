'use client';

import { useEffect, useRef, useState } from 'react';
import { Image as ImageIcon, Loader2, X } from 'lucide-react';
import {
  downloadPhotoAsFile,
  getPhotoThumbnailUrl,
  searchPhotos,
  type GooglePhotosMediaItem,
} from '@/lib/google-photos-api';

let gsiScriptPromise: Promise<void> | null = null;

function loadGsiScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  if (gsiScriptPromise) return gsiScriptPromise;
  gsiScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      if (window.google?.accounts?.oauth2) {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('GSI script error')));
      return;
    }
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Google 로그인 스크립트를 불러오지 못했습니다.'));
    document.body.appendChild(s);
  });
  return gsiScriptPromise;
}

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_PHOTOS_CLIENT_ID;

export type GooglePhotosPickerProps = {
  onFileReady: (file: File) => void | Promise<void>;
  onError?: (message: string) => void;
  disabled?: boolean;
  className?: string;
};

export function GooglePhotosPicker({
  onFileReady,
  onError,
  disabled,
  className = '',
}: GooglePhotosPickerProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [picking, setPicking] = useState(false);
  const [items, setItems] = useState<GooglePhotosMediaItem[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | undefined>();
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [pickerError, setPickerError] = useState<string | null>(null);
  const tokenClientRef = useRef<{ requestAccessToken: (o?: object) => void } | null>(null);
  const cancelledRef = useRef(false);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  useEffect(() => {
    if (!open || !CLIENT_ID) return;
    cancelledRef.current = false;

    const run = async () => {
      try {
        await loadGsiScript();
        if (cancelledRef.current || !window.google?.accounts?.oauth2) {
          setPickerError('Google 로그인을 사용할 수 없습니다.');
          return;
        }

        tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
          client_id: CLIENT_ID,
          scope: 'https://www.googleapis.com/auth/photoslibrary.readonly',
          callback: async (resp) => {
            if (cancelledRef.current) return;
            if (resp.error) {
              const err = (resp as { error_description?: string }).error_description || resp.error;
              setPickerError(err);
              onErrorRef.current?.(err);
              setLoading(false);
              return;
            }
            if (!resp.access_token) {
              setLoading(false);
              return;
            }
            setAccessToken(resp.access_token);
            setLoading(true);
            setPickerError(null);
            try {
              const { mediaItems, nextPageToken: next } = await searchPhotos(resp.access_token);
              if (cancelledRef.current) return;
              setItems(mediaItems);
              setNextPageToken(next);
            } catch (e: unknown) {
              const msg = e instanceof Error ? e.message : String(e);
              if (msg === 'UNAUTHORIZED') {
                setAccessToken(null);
                setPickerError('인증이 만료되었습니다. 아래에서 다시 로그인해 주세요.');
              } else {
                setPickerError(msg);
              }
              onErrorRef.current?.(msg);
            } finally {
              if (!cancelledRef.current) setLoading(false);
            }
          },
        });

        setLoading(true);
        tokenClientRef.current.requestAccessToken();
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : '초기화 실패';
        setPickerError(msg);
        onErrorRef.current?.(msg);
        setLoading(false);
      }
    };

    void run();

    return () => {
      cancelledRef.current = true;
    };
  }, [open]);

  const handleOpen = () => {
    if (!CLIENT_ID) {
      onError?.('Google Photos 연동용 클라이언트 ID가 설정되지 않았습니다.');
      return;
    }
    setOpen(true);
    setItems([]);
    setNextPageToken(undefined);
    setPickerError(null);
    setAccessToken(null);
  };

  const handleClose = () => {
    setOpen(false);
    setPickerError(null);
  };

  const handleSelect = async (item: GooglePhotosMediaItem) => {
    if (!accessToken) return;
    setPicking(true);
    setPickerError(null);
    try {
      const file = await downloadPhotoAsFile(
        item.baseUrl,
        accessToken,
        item.filename || `photo-${item.id}`
      );
      await onFileReady(file);
      handleClose();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '선택한 사진을 가져오지 못했습니다.';
      setPickerError(msg);
      onError?.(msg);
    } finally {
      setPicking(false);
    }
  };

  const handleLoadMore = async () => {
    if (!accessToken || !nextPageToken || loading) return;
    setLoading(true);
    setPickerError(null);
    try {
      const { mediaItems, nextPageToken: next } = await searchPhotos(accessToken, nextPageToken);
      setItems((prev) => [...prev, ...mediaItems]);
      setNextPageToken(next);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setPickerError(msg);
      onErrorRef.current?.(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRetryAuth = () => {
    setPickerError(null);
    setItems([]);
    setNextPageToken(undefined);
    setAccessToken(null);
    setLoading(true);
    tokenClientRef.current?.requestAccessToken({ prompt: 'consent' });
  };

  if (!CLIENT_ID) {
    return null;
  }

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
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
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

            <div className="p-3 text-xs text-gray-500 border-b border-gray-100">
              Google 계정으로 사진 라이브러리 접근 권한을 허용하면 최근 사진이 표시됩니다.
            </div>

            {pickerError && (
              <div className="mx-4 mt-3 p-2 text-sm text-red-700 bg-red-50 rounded flex flex-wrap items-center gap-2">
                <span>{pickerError}</span>
                <button type="button" onClick={handleRetryAuth} className="text-sm underline">
                  다시 로그인
                </button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 min-h-[200px]">
              {loading && items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <Loader2 className="w-8 h-8 animate-spin mb-2" />
                  <p>사진을 불러오는 중…</p>
                </div>
              ) : items.length === 0 && !loading ? (
                <p className="text-center text-gray-500 py-8">표시할 사진이 없습니다.</p>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      disabled={picking || !accessToken}
                      onClick={() => handleSelect(item)}
                      className="relative aspect-square rounded overflow-hidden border border-gray-200 hover:ring-2 hover:ring-black focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50"
                    >
                      {accessToken && (
                        <img
                          src={getPhotoThumbnailUrl(item.baseUrl, accessToken, 200)}
                          alt=""
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {nextPageToken && (
              <div className="p-3 border-t border-gray-100 flex justify-center">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="px-4 py-2 text-sm border border-black rounded hover:bg-black hover:text-white disabled:opacity-50"
                >
                  {loading ? '불러오는 중…' : '더 보기'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
