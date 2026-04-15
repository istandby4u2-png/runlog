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
  CalendarDays,
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

  async function disconnectGooglePhotos() {
    if (!confirm('Google Photos 연결을 해제할까요? 이후 «연결»로 Picker API 권한을 다시 승인할 수 있습니다.')) {
      return;
    }
    try {
      const res = await fetch('/api/oauth/google', { method: 'DELETE' });
      if (res.ok) {
        await fetchConnections();
      }
    } catch {
      // ignore
    }
  }

  async function triggerSync() {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/cron/daily-sync', { credentials: 'include' });
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
            description="오늘 날짜 사진 선택(Picker API). 예전 Library 전용 연결이면 재연결이 필요할 수 있습니다."
            connected={connections?.google_photos?.connected ?? false}
            connectUrl="/api/oauth/google"
            expiryLabel={formatExpiry(connections?.google_photos?.expiresAt)}
            onDisconnect={
              connections?.google_photos?.connected ? disconnectGooglePhotos : undefined
            }
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
          지금 바로 동기화를 실행합니다. <strong>현재 로그인한 계정</strong>의 Strava·날짜별로 선택한 사진·Instagram이
          적용됩니다. 매일 자동 실행(Cron)은 Vercel의{' '}
          <code className="text-xs bg-gray-100 px-1 rounded">AUTO_SYNC_USER_ID</code>에 해당하는 계정을 쓰므로,
          사진이 반영되지 않으면 그 값이 본인 <code className="text-xs bg-gray-100 px-1 rounded">users.id</code>
          와 같은지 확인해 주세요.
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

      {connections?.google_photos?.connected && connections?.strava?.connected && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h2 className="text-lg font-bold text-black mb-2 flex items-center gap-2">
            <CalendarDays className="w-5 h-5" />
            기간 일괄 동기화 (피드 + Instagram)
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            날짜마다 «사진 선택»으로 배경을 지정한 뒤, 범위를 정해 한 번에 RunLog 글을 만들고 Instagram에 올릴 수 있습니다.
            하루에 한 번씩 서버를 호출하므로(인스타 처리 시간 포함) 날짜가 많으면 몇 분 걸릴 수 있습니다.
          </p>
          <BatchBackfill />
        </div>
      )}
    </main>
  );
}

type BatchPreview = {
  ok: boolean;
  pendingDates: string[];
  counts: { withPhoto: number; alreadySynced: number; pending: number };
  datesWithPhoto: string[];
};

function BatchBackfill() {
  const [from, setFrom] = useState('2026-03-09');
  const [to, setTo] = useState('2026-04-15');
  const [preview, setPreview] = useState<BatchPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchLines, setBatchLines] = useState<string[]>([]);

  async function loadPreview() {
    setPreviewLoading(true);
    setPreviewError(null);
    setPreview(null);
    try {
      const res = await fetch(
        `/api/cron/batch-sync/preview?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
      );
      const data = await res.json();
      if (!res.ok) {
        setPreviewError(data.error || '미리보기 실패');
        return;
      }
      setPreview({
        ok: true,
        pendingDates: data.pendingDates || [],
        counts: data.counts,
        datesWithPhoto: data.datesWithPhoto || [],
      });
    } catch (err: unknown) {
      setPreviewError(err instanceof Error ? err.message : String(err));
    } finally {
      setPreviewLoading(false);
    }
  }

  async function runBatch() {
    if (!preview?.pendingDates?.length) {
      window.alert('«미리보기»로 동기화 대기 날짜가 있는지 먼저 확인해 주세요.');
      return;
    }
    const dates = preview.pendingDates;
    if (
      !confirm(
        `${dates.length}일치를 순서대로 처리합니다. 브라우저 탭을 닫지 마세요. 계속할까요?`
      )
    ) {
      return;
    }
    setBatchRunning(true);
    setBatchLines([]);
    try {
      for (let i = 0; i < dates.length; i++) {
        const date = dates[i];
        setBatchLines((prev) => [...prev, `▶ ${date} (${i + 1}/${dates.length}) …`]);
        try {
          const res = await fetch(`/api/cron/batch-sync/day?date=${encodeURIComponent(date)}`);
          const data = await res.json();
          if (!res.ok || !data.ok) {
            setBatchLines((prev) => [
              ...prev,
              `  ✗ 실패: ${data.error || (Array.isArray(data.log) ? data.log.join(' ') : '') || 'unknown'}`,
            ]);
            continue;
          }
          if (data.skipped) {
            setBatchLines((prev) => [
              ...prev,
              `  ⊘ 건너뜀 (${data.skipReason || 'reason'})`,
              ...(Array.isArray(data.log) ? data.log.map((l: string) => `    ${l}`) : []),
            ]);
          } else {
            setBatchLines((prev) => [
              ...prev,
              `  ✓ record #${data.recordId ?? '—'}${data.igMediaId ? `, IG ${data.igMediaId}` : ''}`,
            ]);
          }
        } catch (err: unknown) {
          setBatchLines((prev) => [
            ...prev,
            `  ✗ 네트워크: ${err instanceof Error ? err.message : String(err)}`,
          ]);
        }
        await new Promise((r) => setTimeout(r, 500));
      }
      setBatchLines((prev) => [...prev, '— 완료 —']);
    } finally {
      setBatchRunning(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm text-gray-700">
          시작
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="ml-2 border border-gray-300 rounded px-2 py-1.5 text-sm"
          />
        </label>
        <label className="text-sm text-gray-700">
          종료
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="ml-2 border border-gray-300 rounded px-2 py-1.5 text-sm"
          />
        </label>
        <button
          type="button"
          onClick={loadPreview}
          disabled={previewLoading || batchRunning}
          className="px-4 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          {previewLoading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> 조회 중…
            </span>
          ) : (
            '미리보기'
          )}
        </button>
      </div>

      {previewError && (
        <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">{previewError}</p>
      )}

      {preview && (
        <div className="text-sm space-y-1 text-gray-800 bg-gray-50 border border-gray-200 rounded p-3">
          <p>
            사진 선택됨: <strong>{preview.counts.withPhoto}</strong>일 · 이미 기록 있음:{' '}
            <strong>{preview.counts.alreadySynced}</strong>일 ·{' '}
            <strong className="text-black">동기화 대기: {preview.counts.pending}</strong>일
          </p>
          {preview.pendingDates.length > 0 && (
            <p className="text-xs text-gray-600 break-all">
              대기 날짜: {preview.pendingDates.join(', ')}
            </p>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={runBatch}
        disabled={batchRunning || previewLoading || (preview?.pendingDates.length ?? 0) === 0}
        className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50 text-sm"
      >
        {batchRunning ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            일괄 처리 중…
          </>
        ) : (
          <>
            <Instagram className="w-4 h-4" />
            대기 목록 전부 생성 + Instagram 업로드
          </>
        )}
      </button>

      {batchLines.length > 0 && (
        <pre className="text-xs bg-white border border-gray-200 rounded p-3 max-h-64 overflow-auto whitespace-pre-wrap text-gray-800">
          {batchLines.join('\n')}
        </pre>
      )}
    </div>
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
      if (typeof sessionId !== 'string' || !sessionId.trim()) {
        throw new Error('세션 ID를 받지 못했습니다.');
      }
      setPickerUri(uri);
      setPickerState('picking');

      window.open(uri, '_blank');

      pollingRef.current = setInterval(async () => {
        try {
          const pollRes = await fetch(
            `/api/photos/picker?sessionId=${encodeURIComponent(sessionId)}&date=${encodeURIComponent(photoDate)}`
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
      }, 1500);
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
  onDisconnect,
}: {
  icon: React.ReactNode;
  name: string;
  description: string;
  connected: boolean;
  connectUrl: string | null;
  expiryLabel?: string;
  envBased?: boolean;
  onDisconnect?: () => void | Promise<void>;
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
      <div className="shrink-0 flex flex-col gap-2 items-end">
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
        {connected && onDisconnect && (
          <button
            type="button"
            onClick={() => void onDisconnect()}
            className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50"
          >
            연결 해제
          </button>
        )}
      </div>
    </div>
  );
}
