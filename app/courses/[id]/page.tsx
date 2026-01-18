import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { CourseDetail } from '@/components/CourseDetail';

export default async function CourseDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;
  const isAuthenticated = token ? verifyToken(token) !== null : false;

  if (!isAuthenticated) {
    redirect('/login');
  }

  return (
    <main className="container mx-auto px-4 py-6">
      <CourseDetail courseId={parseInt(params.id)} />
    </main>
  );
}
