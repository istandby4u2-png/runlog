import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { CourseForm } from '@/components/CourseForm';

export const dynamic = 'force-dynamic';

export default async function EditCoursePage({
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
      <h1 className="text-2xl font-bold mb-6">Edit Course</h1>
      <CourseForm courseId={parseInt(params.id)} />
    </main>
  );
}
