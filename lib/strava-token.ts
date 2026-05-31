/**
 * Strava token load → refresh → persist (used by sync, cron, and settings).
 */

import {
  getValidAccessToken,
  isStravaRefreshTokenInvalidError,
} from '@/lib/strava-api';
import { userTokens } from '@/lib/db-supabase';

export type EnsureStravaTokenResult =
  | {
      ok: true;
      accessToken: string;
      refreshed: boolean;
      athleteName?: string;
    }
  | {
      ok: false;
      reason: 'not_connected' | 'refresh_invalid';
      message: string;
    };

export async function ensureStravaAccessToken(
  userId: number
): Promise<EnsureStravaTokenResult> {
  const stored = await userTokens.findByProvider(userId, 'strava');
  if (!stored?.refresh_token) {
    return {
      ok: false,
      reason: 'not_connected',
      message: 'Strava not connected',
    };
  }

  const extraData = stored.extra_data as
    | { athlete_name?: string; athlete_id?: number }
    | null
    | undefined;
  const athleteName =
    typeof extraData?.athlete_name === 'string' ? extraData.athlete_name : undefined;

  try {
    const valid = await getValidAccessToken({
      access_token: stored.access_token,
      refresh_token: stored.refresh_token,
      token_expires_at: stored.token_expires_at,
    });

    const refreshed = valid.access_token !== stored.access_token;
    if (refreshed) {
      await userTokens.upsert({
        user_id: userId,
        provider: 'strava',
        access_token: valid.access_token,
        refresh_token: valid.refresh_token,
        token_expires_at: new Date(valid.expires_at * 1000).toISOString(),
        extra_data: stored.extra_data ?? undefined,
      });
    }

    return {
      ok: true,
      accessToken: valid.access_token,
      refreshed,
      athleteName,
    };
  } catch (err: unknown) {
    if (isStravaRefreshTokenInvalidError(err)) {
      await userTokens.delete(userId, 'strava');
      return {
        ok: false,
        reason: 'refresh_invalid',
        message: err.message,
      };
    }
    throw err;
  }
}

export async function refreshStravaTokensForAllUsers(): Promise<{
  refreshed: number;
  skipped: number;
  invalid: number;
  errors: string[];
}> {
  const { supabaseAdmin } = await import('@/lib/supabase');
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not initialized');
  }

  const { data, error } = await supabaseAdmin
    .from('user_tokens')
    .select('user_id')
    .eq('provider', 'strava')
    .not('refresh_token', 'is', null);

  if (error) {
    throw new Error(`Failed to list Strava tokens: ${error.message}`);
  }

  let refreshed = 0;
  let skipped = 0;
  let invalid = 0;
  const errors: string[] = [];

  for (const row of data || []) {
    const userId = row.user_id as number;
    try {
      const result = await ensureStravaAccessToken(userId);
      if (result.ok) {
        if (result.refreshed) refreshed += 1;
        else skipped += 1;
      } else if (result.reason === 'refresh_invalid') {
        invalid += 1;
        errors.push(`user ${userId}: refresh token invalid`);
      } else {
        skipped += 1;
      }
    } catch (err: unknown) {
      errors.push(
        `user ${userId}: ${err instanceof Error ? err.message : String(err)}`
      );
    }
  }

  return { refreshed, skipped, invalid, errors };
}
