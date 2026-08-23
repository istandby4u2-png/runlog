import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const CRON_SECRET = process.env.CRON_SECRET;

/** 대량 스캔·삭제 — 목록 페이지네이션이 길어질 수 있어 넉넉히 */
export const maxDuration = 300;
export const dynamic = 'force-dynamic';

const DATA_BUCKET = 'runlog-data';
const PAGE = 1000;
const DELETE_BATCH = 100;
/** 방금 올라와 아직 DB에 연결되지 않은 파일을 지우지 않도록 하는 유예 시간 */
const MIN_AGE_MS = 60 * 60 * 1000;

/** 이미지 URL이 참조하는 DB 컬럼 — 하나라도 조회에 실패하면 삭제를 중단한다 */
const REFERENCING_COLUMNS: { table: string; column: string }[] = [
  { table: 'running_records', column: 'image_url' },
  { table: 'courses', column: 'image_url' },
  { table: 'users', column: 'profile_image_url' },
  { table: 'picked_photos', column: 'blob_url' },
];

type StoredObject = { path: string; size: number; createdAt: number };

function objectPathFromPublicUrl(url: string, bucket: string): string | null {
  try {
    const marker = `/object/public/${bucket}/`;
    const u = new URL(url);
    const idx = u.pathname.indexOf(marker);
    if (idx === -1) return null;
    const p = u.pathname.slice(idx + marker.length);
    return p ? decodeURIComponent(p) : null;
  } catch {
    return null;
  }
}

/** 버킷 하위 전체 객체를 재귀적으로 나열 (폴더 엔트리는 id가 null) */
async function listAllObjects(
  bucket: string,
  rootPrefix: string
): Promise<StoredObject[]> {
  if (!supabaseAdmin) return [];
  const out: StoredObject[] = [];
  const stack: string[] = [rootPrefix];

  while (stack.length > 0) {
    const dir = stack.pop() as string;
    let offset = 0;
    for (;;) {
      const { data, error } = await supabaseAdmin.storage.from(bucket).list(dir, {
        limit: PAGE,
        offset,
        sortBy: { column: 'name', order: 'asc' },
      });
      if (error || !data || data.length === 0) break;

      for (const entry of data) {
        const full = dir ? `${dir}/${entry.name}` : entry.name;
        if (entry.id === null) {
          stack.push(full);
          continue;
        }
        const meta = entry.metadata as { size?: number } | null;
        out.push({
          path: full,
          size: Number(meta?.size ?? 0),
          createdAt:
            Date.parse(entry.created_at ?? entry.updated_at ?? '') || 0,
        });
      }
      if (data.length < PAGE) break;
      offset += PAGE;
    }
  }
  return out;
}

async function removeInBatches(
  bucket: string,
  paths: string[]
): Promise<{ deleted: number; errors: string[] }> {
  if (!supabaseAdmin) return { deleted: 0, errors: ['supabase admin 미초기화'] };
  let deleted = 0;
  const errors: string[] = [];
  for (let i = 0; i < paths.length; i += DELETE_BATCH) {
    const batch = paths.slice(i, i + DELETE_BATCH);
    const { error } = await supabaseAdmin.storage.from(bucket).remove(batch);
    if (error) errors.push(error.message);
    else deleted += batch.length;
  }
  return { deleted, errors };
}

function kstDateString(offsetDays = 0): string {
  const d = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' })
  );
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function mb(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

/**
 * GET /api/admin/storage-cleanup            드라이런 (삭제 없음)
 * GET /api/admin/storage-cleanup?apply=1    실제 삭제
 * GET ...&keepDays=2                        후보 사진 보존 일수 (기본 2)
 *
 * 스토리지에서 «아무도 참조하지 않는» 객체를 회수한다. 대부분은 게시가 끝난
 * Instagram 카드와, 단축어가 사진을 여러 번 보내며 남긴 이전 선택 사진이다.
 * 기록·코스·프로필·picked_photos가 가리키는 URL은 절대 지우지 않는다.
 */
export async function GET(request: NextRequest) {
  if (!CRON_SECRET || request.headers.get('authorization') !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: 'Supabase 관리자 클라이언트가 초기화되지 않았습니다.' },
      { status: 500 }
    );
  }

  const cardBucket = process.env.SUPABASE_PUBLIC_CARD_BUCKET?.trim();
  if (!cardBucket) {
    return NextResponse.json(
      { error: 'SUPABASE_PUBLIC_CARD_BUCKET 미설정' },
      { status: 500 }
    );
  }

  const apply = request.nextUrl.searchParams.get('apply') === '1';
  const keepDaysRaw = parseInt(
    request.nextUrl.searchParams.get('keepDays') || '2',
    10
  );
  const keepDays = Number.isFinite(keepDaysRaw) && keepDaysRaw >= 0 ? keepDaysRaw : 2;

  // ---------------------------------------------------------------
  // 1. 참조 중인 객체 경로 수집 (하나라도 실패하면 삭제하지 않는다)
  // ---------------------------------------------------------------
  const referenced = new Set<string>();
  const addRef = (v: unknown) => {
    if (typeof v !== 'string' || !v.trim()) return;
    const p = objectPathFromPublicUrl(v.trim(), cardBucket);
    if (p) referenced.add(p);
  };

  for (const { table, column } of REFERENCING_COLUMNS) {
    let from = 0;
    for (;;) {
      const { data, error } = await supabaseAdmin
        .from(table)
        .select(column)
        .range(from, from + PAGE - 1);
      if (error) {
        return NextResponse.json(
          {
            error: `참조 조회 실패(${table}.${column}): ${error.message}. 안전을 위해 삭제하지 않고 중단합니다.`,
          },
          { status: 500 }
        );
      }
      if (!data || data.length === 0) break;
      for (const row of data) addRef((row as Record<string, unknown>)[column]);
      if (data.length < PAGE) break;
      from += PAGE;
    }
  }

  // ---------------------------------------------------------------
  // 2. 공개 버킷의 고아 객체
  // ---------------------------------------------------------------
  const now = Date.now();
  const allCards = await listAllObjects(cardBucket, '');
  const orphans = allCards.filter(
    (o) => !referenced.has(o.path) && now - o.createdAt > MIN_AGE_MS
  );
  const orphanBytes = orphans.reduce((s, o) => s + o.size, 0);

  // ---------------------------------------------------------------
  // 3. 오래된 후보 사진 (photos-candidates/{userId}/{YYYY-MM-DD}/)
  // ---------------------------------------------------------------
  const cutoff = kstDateString(-keepDays);
  const allCandidates = await listAllObjects(DATA_BUCKET, 'photos-candidates');
  const staleCandidates = allCandidates.filter((o) => {
    const m = o.path.match(/^photos-candidates\/\d+\/(\d{4}-\d{2}-\d{2})\//);
    return !!m && m[1] < cutoff;
  });
  const candidateBytes = staleCandidates.reduce((s, o) => s + o.size, 0);

  const result: Record<string, unknown> = {
    ok: true,
    applied: apply,
    cardBucket,
    cards: {
      scanned: allCards.length,
      referenced: referenced.size,
      orphans: orphans.length,
      orphanSize: mb(orphanBytes),
    },
    candidates: {
      scanned: allCandidates.length,
      cutoffDate: cutoff,
      stale: staleCandidates.length,
      staleSize: mb(candidateBytes),
    },
    reclaimable: mb(orphanBytes + candidateBytes),
    sampleOrphans: orphans.slice(0, 10).map((o) => o.path),
  };

  if (!apply) {
    result.hint = '삭제하려면 ?apply=1 을 붙여 다시 호출하세요.';
    return NextResponse.json(result);
  }

  const cardDel = await removeInBatches(cardBucket, orphans.map((o) => o.path));
  const candDel = await removeInBatches(
    DATA_BUCKET,
    staleCandidates.map((o) => o.path)
  );

  result.deleted = {
    cards: cardDel.deleted,
    candidates: candDel.deleted,
    freed: mb(orphanBytes + candidateBytes),
  };
  const errors = [...cardDel.errors, ...candDel.errors];
  if (errors.length > 0) result.errors = errors.slice(0, 5);

  return NextResponse.json(result);
}
