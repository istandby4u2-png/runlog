/**
 * Instagram Graph API helpers for Content Publishing.
 *
 * Prerequisites:
 *  - Instagram Business / Creator account linked to a Facebook Page
 *  - Meta App with instagram_business_basic + instagram_business_content_publish permissions
 *  - Long-lived user access token stored in user_tokens table
 *
 * @see https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/content-publishing/
 */

const META_APP_ID = process.env.META_APP_ID || '';
const META_APP_SECRET = process.env.META_APP_SECRET || '';
const INSTAGRAM_REDIRECT_URI =
  process.env.INSTAGRAM_REDIRECT_URI || 'https://runlog.life/api/oauth/instagram/callback';
const GRAPH_API_VERSION = 'v22.0';

// ---------------------------------------------------------------------------
// OAuth helpers
// ---------------------------------------------------------------------------

export function getInstagramAuthUrl(state?: string): string {
  const params = new URLSearchParams({
    client_id: META_APP_ID,
    redirect_uri: INSTAGRAM_REDIRECT_URI,
    response_type: 'code',
    scope: 'instagram_business_basic,instagram_business_content_publish',
  });
  if (state) params.set('state', state);
  return `https://www.instagram.com/oauth/authorize?${params.toString()}`;
}

/** Exchange the authorization code for a short-lived token. */
export async function exchangeCodeForToken(code: string): Promise<{
  access_token: string;
  user_id: string;
}> {
  const res = await fetch('https://api.instagram.com/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: META_APP_ID,
      client_secret: META_APP_SECRET,
      grant_type: 'authorization_code',
      redirect_uri: INSTAGRAM_REDIRECT_URI,
      code,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Instagram token exchange failed: ${text}`);
  }
  return (await res.json()) as { access_token: string; user_id: string };
}

/** Exchange a short-lived token for a long-lived one (~60 days). */
export async function getLongLivedToken(shortLivedToken: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const params = new URLSearchParams({
    grant_type: 'ig_exchange_token',
    client_secret: META_APP_SECRET,
    access_token: shortLivedToken,
  });
  const res = await fetch(
    `https://graph.instagram.com/access_token?${params.toString()}`
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Instagram long-lived token exchange failed: ${text}`);
  }
  return (await res.json()) as { access_token: string; expires_in: number };
}

/** Refresh a long-lived token (must be ≥24h old and not expired). */
export async function refreshLongLivedToken(currentToken: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const params = new URLSearchParams({
    grant_type: 'ig_refresh_token',
    access_token: currentToken,
  });
  const res = await fetch(
    `https://graph.instagram.com/refresh_access_token?${params.toString()}`
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Instagram token refresh failed: ${text}`);
  }
  return (await res.json()) as { access_token: string; expires_in: number };
}

// ---------------------------------------------------------------------------
// Content Publishing
// ---------------------------------------------------------------------------

/**
 * Step 1: Create a media container (image post).
 * The image_url must be a publicly accessible JPEG URL.
 */
export async function createMediaContainer(
  igUserId: string,
  accessToken: string,
  imageUrl: string,
  caption: string
): Promise<string> {
  const res = await fetch(
    `https://graph.instagram.com/${GRAPH_API_VERSION}/${igUserId}/media`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ image_url: imageUrl, caption }),
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Instagram create container failed: ${text}`);
  }
  const data = (await res.json()) as { id: string };
  return data.id;
}

/** Step 2: Publish a prepared media container. */
export async function publishMedia(
  igUserId: string,
  accessToken: string,
  containerId: string
): Promise<string> {
  const res = await fetch(
    `https://graph.instagram.com/${GRAPH_API_VERSION}/${igUserId}/media_publish`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ creation_id: containerId }),
    }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Instagram publish failed: ${text}`);
  }
  const data = (await res.json()) as { id: string };
  return data.id;
}

/**
 * Convenience: publish a single image to Instagram.
 * Returns the published media ID.
 */
export async function publishImagePost(
  igUserId: string,
  accessToken: string,
  imageUrl: string,
  caption: string
): Promise<string> {
  const containerId = await createMediaContainer(igUserId, accessToken, imageUrl, caption);
  return publishMedia(igUserId, accessToken, containerId);
}
