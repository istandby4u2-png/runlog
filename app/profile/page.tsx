import { redirect } from 'next/navigation';
import { verifyToken, getUserFromRequest } from '@/lib/auth';
import { LogoutButton } from '@/components/LogoutButton';
import { ProfileForm } from '@/components/ProfileForm';

// 이 페이지는 동적이므로 정적 생성 비활성화
export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const user = await getUserFromRequest();

  if (!user) {
    redirect('/login');
  }

  return (
    <main className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        <ProfileForm user={user} />
        <div className="mt-6 pt-6 border-t border-gray-200">
          <LogoutButton />
        </div>
      </div>
    </main>
  );
}
