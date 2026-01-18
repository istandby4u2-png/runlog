'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Course } from '@/types';
import { MapPin, Heart, MessageCircle } from 'lucide-react';

export function CourseList() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses');
      const data = await response.json();
      setCourses(data);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">로딩 중...</div>;
  }

  if (courses.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        등록된 코스가 없습니다.
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {courses.map((course) => (
        <Link
          key={course.id}
          href={`/courses/${course.id}`}
          className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
        >
          {course.image_url && (
            <div className="w-full h-48 bg-gray-200 relative">
              <img
                src={course.image_url}
                alt={course.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-2">{course.title}</h3>
            {course.description && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {course.description}
              </p>
            )}
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {course.distance ? `${course.distance.toFixed(2)} km` : '-'}
                </span>
                <span className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  {course.likes_count || 0}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" />
                  {course.comments_count || 0}
                </span>
              </div>
              <span className="text-xs">{course.username}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
