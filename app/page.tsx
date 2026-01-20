import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { Feed } from '@/components/Feed';

// 이 페이지는 동적이므로 정적 생성 비활성화
export const dynamic = 'force-dynamic';

export default async function Home() {
  // Allow unauthenticated users to view public content
  return (
    <main className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Running Feed</h1>
      <Feed />
    </main>
  );
}
