import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { CourseList } from '@/components/CourseList';

export default async function CoursesPage() {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;
  const isAuthenticated = token ? verifyToken(token) !== null : false;

  if (!isAuthenticated) {
    redirect('/login');
  }

  return (
    <main className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Running Course</h1>
        <Link
          href="/courses/new"
          className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-700"
        >
          <Plus className="w-5 h-5" />
          <span>New Course</span>
        </Link>
      </div>
      <CourseList />
    </main>
  );
}
