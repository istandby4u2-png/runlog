import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { CourseForm } from '@/components/CourseForm';

export default async function NewCoursePage() {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;
  const isAuthenticated = token ? verifyToken(token) !== null : false;

  if (!isAuthenticated) {
    redirect('/login');
  }

  return (
    <main className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">새 코스 등록</h1>
      <CourseForm />
    </main>
  );
}
