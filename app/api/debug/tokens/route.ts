import { NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';
import { userTokens } from '@/lib/db-supabase';
import {
  isGoogleRefreshTokenInvalidError,
  refreshAccessToken,
  GOOGLE_RECONNECT_MESSAGE,
} from '@/lib/google-photos-api';

export const dynamic = 'force-dynamic';

/**
 * Debug endpoint to check stored token scopes and validity.
 * GET /api/debug/tokens
 */
export async function GET() {
  const userId = getUserIdFromRequest();
  if (!userId) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  const result: Record<string, unknown> = { userId };

  // --- Google Photos token check ---
  try {
    const gpToken = await userTokens.findByProvider(userId, 'google_photos');
    if (gpToken?.refresh_token) {
      const { access_token } = await refreshAccessToken(gpToken.refresh_token);

      // Check token info via Google's tokeninfo endpoint
      const infoRes = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?access_token=${access_token}`
      );
      const tokenInfo = await infoRes.json();

      result.google_photos = {
        has_refresh_token: true,
        token_expires_at: gpToken.token_expires_at,
        tokeninfo: tokenInfo,
      };
    } else {
      result.google_photos = { has_refresh_token: false };
    }
  } catch (err: unknown) {
    if (isGoogleRefreshTokenInvalidError(err)) {
      try {
        await userTokens.delete(userId, 'google_photos');
      } catch {
        /* ignore */
      }
      result.google_photos = {
        has_refresh_token: false,
        needs_reconnect: true,
        message: err.message,
        code: err.code,
      };
    } else {
      result.google_photos = {
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  // --- Instagram token check ---
  try {
    const igToken = await userTokens.findByProvider(userId, 'instagram');
    if (igToken?.access_token) {
      const igUserId = (igToken.extra_data as { ig_user_id?: string })?.ig_user_id;

      // Verify token with /me endpoint
      const meRes = await fetch(
        `https://graph.instagram.com/me?fields=id,username,account_type&access_token=${igToken.access_token}`
      );
      const meData = await meRes.json();

      result.instagram = {
        stored_ig_user_id: igUserId,
        token_expires_at: igToken.token_expires_at,
        me_response: meData,
      };
    } else {
      result.instagram = { connected: false };
    }
  } catch (err: unknown) {
    result.instagram = {
      error: err instanceof Error ? err.message : String(err),
    };
  }

  return NextResponse.json(result);
}
