import { redirect } from 'next/navigation';
import { getUserFromRequest } from '@/lib/auth';
import { ProfileEditForm } from '@/components/ProfileEditForm';

// This page is dynamic
export const dynamic = 'force-dynamic';

export default async function ProfileEditPage() {
  const user = await getUserFromRequest();

  if (!user) {
    redirect('/login');
  }

  return (
    <main className="container mx-auto px-4 py-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>
      <ProfileEditForm user={user} />
    </main>
  );
}
