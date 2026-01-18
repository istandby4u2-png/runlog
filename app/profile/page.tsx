import { redirect } from 'next/navigation';
import { verifyToken, getUserFromRequest } from '@/lib/auth';
import { LogoutButton } from '@/components/LogoutButton';

export default async function ProfilePage() {
  const user = getUserFromRequest();

  if (!user) {
    redirect('/login');
  }

  return (
    <main className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Username
          </label>
          <p className="text-lg">{user.username}</p>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <p className="text-lg">{user.email}</p>
        </div>
        <div className="mt-6">
          <LogoutButton />
        </div>
      </div>
    </main>
  );
}
