/**
 * Instagram 게시: 공개 이미지 URL + 캡션 (동기화·재게시 공통).
 */

import { userTokens } from '@/lib/db-supabase';
import { publishImagePost, refreshLongLivedToken } from '@/lib/instagram-api';

export async function publishPublicImageToInstagramForUser(
  userId: number,
  publicImageUrl: string,
  caption: string
): Promise<{ igMediaId: string | null; log: string[] }> {
  const log: string[] = [];
  try {
    const igToken = await userTokens.findByProvider(userId, 'instagram');
    if (!igToken?.access_token || !igToken.extra_data) {
      log.push('Instagram: 미연결');
      return { igMediaId: null, log };
    }

    let accessToken = igToken.access_token;

    const meRes = await fetch(
      `https://graph.instagram.com/me?fields=id&access_token=${accessToken}`
    );
    const meData = (await meRes.json()) as { id?: string; error?: unknown };
    const igUserId = meData.id;
    if (!igUserId) {
      log.push(`Instagram: 사용자 ID 실패: ${JSON.stringify(meData)}`);
      return { igMediaId: null, log };
    }

    const storedId = String(
      (igToken.extra_data as { ig_user_id?: string | number }).ig_user_id || ''
    );
    if (storedId !== igUserId) {
      await userTokens.upsert({
        user_id: userId,
        provider: 'instagram',
        access_token: accessToken,
        token_expires_at: igToken.token_expires_at,
        extra_data: { ig_user_id: igUserId },
      });
    }

    const expiresAt = igToken.token_expires_at
      ? new Date(igToken.token_expires_at).getTime()
      : 0;
    if (expiresAt > 0 && expiresAt - Date.now() < 7 * 24 * 3600 * 1000) {
      try {
        const refreshed = await refreshLongLivedToken(accessToken);
        accessToken = refreshed.access_token;
        await userTokens.upsert({
          user_id: userId,
          provider: 'instagram',
          access_token: accessToken,
          token_expires_at: new Date(
            Date.now() + refreshed.expires_in * 1000
          ).toISOString(),
          extra_data: { ig_user_id: igUserId },
        });
        log.push('Instagram: token refreshed');
      } catch (refreshErr: unknown) {
        log.push(
          `Instagram token refresh 경고: ${refreshErr instanceof Error ? refreshErr.message : String(refreshErr)}`
        );
      }
    }

    const igMediaId = await publishImagePost(
      igUserId,
      accessToken,
      publicImageUrl,
      caption
    );
    log.push(`Instagram 게시: ${igMediaId}`);
    return { igMediaId, log };
  } catch (err: unknown) {
    log.push(`Instagram error: ${err instanceof Error ? err.message : String(err)}`);
    return { igMediaId: null, log };
  }
}
