import sharp from 'sharp';

/**
 * 카드 배경으로 쓸 사진의 저장 규격.
 *
 * Instagram 카드가 1080×1080이라 그보다 조금 큰 1400px이면 충분하다. 원본
 * 해상도(예: 4284×5712, 3.5MB)를 그대로 저장하던 것이 2026-08 스토리지 한도
 * 초과의 주원인이었다 — 원본 310장이 1.1GB를 차지했다.
 */
export const CARD_PHOTO_MAX_PX = 1400;
export const CARD_PHOTO_QUALITY = 82;

/**
 * EXIF 회전을 픽셀에 반영하고(satori 카드 생성기는 orientation을 무시한다)
 * 카드에 필요한 크기로 줄여 JPEG로 정규화. 실패하면 원본을 그대로 돌려준다.
 */
export async function normalizePhotoForCard(
  buffer: Buffer,
  mimeType: string
): Promise<{ buffer: Buffer; mimeType: string }> {
  try {
    const out = await sharp(buffer)
      .rotate()
      .resize({
        width: CARD_PHOTO_MAX_PX,
        height: CARD_PHOTO_MAX_PX,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: CARD_PHOTO_QUALITY })
      .toBuffer();
    return { buffer: out, mimeType: 'image/jpeg' };
  } catch (err: unknown) {
    console.warn(
      '사진 정규화 실패, 원본 사용:',
      err instanceof Error ? err.message : err
    );
    return { buffer, mimeType };
  }
}
