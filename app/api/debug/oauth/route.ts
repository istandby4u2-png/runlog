import { NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const userId = getUserIdFromRequest();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    google_client_id: process.env.GOOGLE_CLIENT_ID
      ? `set (${process.env.GOOGLE_CLIENT_ID.slice(0, 10)}...)`
      : 'NOT SET',
    next_public_google_photos_client_id: process.env.NEXT_PUBLIC_GOOGLE_PHOTOS_CLIENT_ID
      ? `set (${process.env.NEXT_PUBLIC_GOOGLE_PHOTOS_CLIENT_ID.slice(0, 10)}...)`
      : 'NOT SET',
    google_client_secret: process.env.GOOGLE_CLIENT_SECRET
      ? `set (length: ${process.env.GOOGLE_CLIENT_SECRET.length})`
      : 'NOT SET',
    google_redirect_uri: process.env.GOOGLE_REDIRECT_URI || 'NOT SET (using default)',
    resolved_client_id: (process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_PHOTOS_CLIENT_ID || 'EMPTY').slice(0, 15) + '...',
  });
}
