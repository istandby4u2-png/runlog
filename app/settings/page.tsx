'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Activity,
  ImageIcon,
  Instagram,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  Clock,
  Camera,
  ExternalLink,
  Loader2,
} from 'lucide-react';

interface ConnectionStatus {
  connected: boolean;
  expiresAt?: string | null;
}

type Connections = Record<string, ConnectionStatus>;

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-6 text-center text-gray-500">로딩 중...</div>}>
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  const searchParams = useSearchParams();
  const [connections, setConnections] = useState<Connections | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const success = searchParams.get('success');
  const error = searchParams.get('error');

  useEffect(() => {
    fetchConnections();
  }, []);

  async function fetchConnections() {
    try {
      const res = await fetch('/api/settings/connections');
      if (res.ok) {
        setConnections(await res.json());
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function triggerSync() {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/cron/daily-sync');
      const data = await res.json();
      if (data.ok) {
        setSyncResult(
          data.synced
            ? `동기화 완료! Record #${data.recordId}${data.igMediaId ? `, Instagram 게시됨` : ''}`
            : '오늘 러닝 기록이 없습니다.'
        );
      } else {
        setSyncResult(`오류: ${data.error || '알 수 없는 오류'}`);
      }
    } catch (err: unknown) {
      setSyncResult(`네트워크 오류: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSyncing(false);
    }
  }

  function formatExpiry(iso: string | null | undefined): string {
    if (!iso) return '';
    const d = new Date(iso);
    const days = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days <= 0) return '만료됨';
    return `${days}일 남음`;
  }

  return (
    <main className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/profile" className="p-1 rounded hover:bg-gray-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold text-black">자동 동기화 설정</h1>
      </div>

      {/* Flash messages */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded flex items-center gap-2 text-green-800 text-sm">
          <CheckCircle className="w-4 h-4 shrink-0" />
          {success === 'strava' && 'Strava 연결 완료!'}
          {success === 'google_photos' && 'Google Photos 연결 완료!'}
          {success === 'instagram' && 'Instagram 연결 완료!'}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded flex items-center gap-2 text-red-800 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          연결 중 오류가 발생했습니다: {error}
        </div>
      )}

      {/* Description */}
      <div className="mb-6 p-4 bg-gray-50 rounded border border-gray-200 text-sm text-gray-700 space-y-1">
        <p>매일 21:00 (KST)에 자동으로 실행됩니다:</p>
        <ol className="list-decimal list-inside space-y-0.5">
          <li>Strava에서 오늘의 러닝 기록을 가져옵니다</li>
          <li>미리 선택한 Google Photos 사진을 배경으로 사용합니다</li>
          <li>RunLog에 기록을 생성하고 Instagram에 자동 게시합니다</li>
        </ol>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">로딩 중...</div>
      ) : (
        <div className="space-y-4">
          {/* Strava */}
          <ServiceCard
            icon={<Activity className="w-6 h-6" />}
            name="Strava"
            description="러닝 기록 자동 가져오기 (거리, 시간, 심박, 칼로리, 페이스)"
            connected={connections?.strava?.connected ?? false}
            connectUrl="/api/oauth/strava"
            expiryLabel={formatExpiry(connections?.strava?.expiresAt)}
          />

          {/* Google Photos */}
          <ServiceCard
            icon={<ImageIcon className="w-6 h-6" />}
            name="Google Photos"
            description="오늘 날짜 사진 자동 첨부"
            connected={connections?.google_photos?.connected ?? false}
            connectUrl="/api/oauth/google"
            expiryLabel={formatExpiry(connections?.google_photos?.expiresAt)}
          />

          {/* Instagram */}
          <ServiceCard
            icon={<Instagram className="w-6 h-6" />}
            name="Instagram"
            description="러닝 카드 이미지 자동 게시 (Business/Creator 계정 필요)"
            connected={connections?.instagram?.connected ?? false}
            connectUrl="/api/oauth/instagram"
            expiryLabel={formatExpiry(connections?.instagram?.expiresAt)}
          />
        </div>
      )}

      {/* Photo Picker */}
      {connections?.google_photos?.connected && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h2 className="text-lg font-bold text-black mb-3">오늘의 사진 선택</h2>
          <p className="text-sm text-gray-600 mb-4">
            Google Photos에서 Instagram 카드 배경으로 사용할 사진을 선택하세요.
            선택하지 않으면 기본 그라데이션 배경이 사용됩니다.
          </p>
          <PhotoPicker />
        </div>
      )}

      {/* Manual sync trigger */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h2 className="text-lg font-bold text-black mb-3">수동 동기화</h2>
        <p className="text-sm text-gray-600 mb-4">
          지금 바로 동기화를 실행합니다. 21:00 자동 실행과 동일한 동작입니다.
        </p>
        <button
          onClick={triggerSync}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50 transition-colors text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? '동기화 중...' : '지금 동기화 실행'}
        </button>
        {syncResult && (
          <p className="mt-3 text-sm text-gray-700 bg-gray-50 p-3 rounded border border-gray-200">
            {syncResult}
          </p>
        )}
      </div>
    </main>
  );
}

function PhotoPicker() {
  const [pickerState, setPickerState] = useState<
    'idle' | 'creating' | 'picking' | 'processing' | 'done' | 'error'
  >('idle');
  const [pickerUri, setPickerUri] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const todayKST = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' })
  ).toISOString().slice(0, 10);

  const [photoDate, setPhotoDate] = useState(todayKST);

  const cleanup = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  useEffect(() => cleanup, [cleanup]);

  async function startPicker() {
    setPickerState('creating');
    setErrorMsg(null);
    setResultUrl(null);

    try {
      const res = await fetch('/api/photos/picker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: photoDate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Session 생성 실패');

      const { sessionId, pickerUri: uri } = data;
      setPickerUri(uri);
      setPickerState('picking');

      window.open(uri, '_blank');

      pollingRef.current = setInterval(async () => {
        try {
          const pollRes = await fetch(
            `/api/photos/picker?sessionId=${sessionId}&date=${photoDate}`
          );
          const pollData = await pollRes.json();

          if (pollData.status === 'done') {
            cleanup();
            setResultUrl(pollData.blobUrl);
            setPickerState('done');
          } else if (pollData.status === 'empty') {
            cleanup();
            setErrorMsg('사진이 선택되지 않았습니다.');
            setPickerState('error');
          } else if (pollData.error) {
            cleanup();
            setErrorMsg(pollData.error);
            setPickerState('error');
          }
        } catch {
          // keep polling
        }
      }, 3000);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setPickerState('error');
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <input
          type="date"
          value={photoDate}
          onChange={(e) => setPhotoDate(e.target.value)}
          className="border border-gray-300 rounded px-3 py-1.5 text-sm"
        />
        <button
          onClick={startPicker}
          disabled={pickerState === 'creating' || pickerState === 'picking'}
          className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50 transition-colors text-sm"
        >
          {pickerState === 'creating' || pickerState === 'picking' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Camera className="w-4 h-4" />
          )}
          {pickerState === 'picking' ? '사진 선택 대기 중...' : '사진 선택'}
        </button>
      </div>

      {pickerState === 'picking' && pickerUri && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800 space-y-2">
          <p>Google Photos에서 사진을 선택해주세요. 선택이 완료되면 자동으로 감지됩니다.</p>
          <a
            href={pickerUri}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-600 underline"
          >
            Google Photos 열기 <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}

      {pickerState === 'done' && resultUrl && (
        <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-800 flex items-center gap-3">
          <img src={resultUrl} alt="Selected" className="w-16 h-16 object-cover rounded" />
          <div>
            <p className="font-medium">사진 저장 완료!</p>
            <p className="text-xs text-green-600">{photoDate} 날짜로 저장되었습니다.</p>
          </div>
        </div>
      )}

      {pickerState === 'error' && errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {errorMsg}
        </div>
      )}
    </div>
  );
}

function ServiceCard({
  icon,
  name,
  description,
  connected,
  connectUrl,
  expiryLabel,
  envBased,
}: {
  icon: React.ReactNode;
  name: string;
  description: string;
  connected: boolean;
  connectUrl: string | null;
  expiryLabel?: string;
  envBased?: boolean;
}) {
  return (
    <div className="bg-white rounded border border-gray-200 p-4 flex items-center gap-4">
      <div className="text-gray-600 shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-black">{name}</h3>
          {connected ? (
            <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
              <CheckCircle className="w-3 h-3" /> 연결됨
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
              <XCircle className="w-3 h-3" /> 미연결
            </span>
          )}
        </div>
        <p className="text-sm text-gray-600 mt-0.5">{description}</p>
        {expiryLabel && (
          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
            <Clock className="w-3 h-3" /> 토큰 {expiryLabel}
          </p>
        )}
      </div>
      <div className="shrink-0">
        {envBased ? (
          <span className="text-xs text-gray-400">환경변수 설정</span>
        ) : connectUrl ? (
          <a
            href={connectUrl}
            className="px-3 py-1.5 border border-black text-black rounded text-sm hover:bg-black hover:text-white transition-colors"
          >
            {connected ? '재연결' : '연결'}
          </a>
        ) : null}
      </div>
    </div>
  );
}
