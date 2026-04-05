import type { LatLng } from '@/types';

const MAX_POINTS = 4000;

function parseFloatAttr(el: Element, name: string): number | null {
  const v = el.getAttribute(name);
  if (v == null || v === '') return null;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

function pushPointsFromElements(elements: Iterable<Element>, out: LatLng[]) {
  for (const el of elements) {
    const lat = parseFloatAttr(el, 'lat');
    const lon = parseFloatAttr(el, 'lon') ?? parseFloatAttr(el, 'lng');
    if (lat != null && lon != null) {
      out.push({ lat, lng: lon });
    }
  }
}

/**
 * GPX 1.1 문자열에서 트랙/경로 포인트를 순서대로 추출합니다.
 * trkpt → rtept → wpt 순으로 시도합니다.
 */
export function parseGpxToPath(xmlText: string): LatLng[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'application/xml');
  const err = doc.querySelector('parsererror');
  if (err) {
    throw new Error('GPX 파일 형식이 올바르지 않습니다.');
  }

  const points: LatLng[] = [];

  const trkpts = doc.querySelectorAll('trkpt');
  if (trkpts.length > 0) {
    pushPointsFromElements(trkpts, points);
  }

  if (points.length === 0) {
    const rtepts = doc.querySelectorAll('rtept');
    if (rtepts.length > 0) {
      pushPointsFromElements(rtepts, points);
    }
  }

  if (points.length === 0) {
    const wpts = doc.querySelectorAll('wpt');
    if (wpts.length > 0) {
      pushPointsFromElements(wpts, points);
    }
  }

  if (points.length < 2) {
    throw new Error('GPX에 유효한 경로 포인트가 2개 이상 필요합니다.');
  }

  return simplifyPath(points, MAX_POINTS);
}

/** 포인트가 너무 많을 때 균등 샘플링으로 줄입니다. */
export function simplifyPath(points: LatLng[], maxPoints: number): LatLng[] {
  if (points.length <= maxPoints) return points;
  const step = Math.ceil(points.length / maxPoints);
  const out: LatLng[] = [];
  for (let i = 0; i < points.length; i += step) {
    out.push(points[i]);
  }
  const last = points[points.length - 1];
  const prev = out[out.length - 1];
  if (prev.lat !== last.lat || prev.lng !== last.lng) {
    out.push(last);
  }
  return out;
}
