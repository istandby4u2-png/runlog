import { CourseDetail } from '@/components/CourseDetail';

export default async function CourseDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <main className="container mx-auto px-4 py-6">
      <CourseDetail courseId={parseInt(params.id)} />
    </main>
  );
}
