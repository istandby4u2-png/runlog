'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Course } from '@/types';
import { MapPin, Heart, MessageCircle, Edit, Trash2, Search } from 'lucide-react';

export function CourseList() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async (search?: string) => {
    try {
      setLoading(true);
      const url = search && search.trim() 
        ? `/api/courses?search=${encodeURIComponent(search.trim())}`
        : '/api/courses';
      const response = await fetch(url);
      const data = await response.json();
      setCourses(data);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCourses(searchQuery);
  };

  const handleDelete = async (courseId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this course?')) {
      return;
    }

    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchCourses();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete course.');
      }
    } catch (error) {
      console.error('Failed to delete course:', error);
      alert('An error occurred while deleting the course.');
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search courses by title or description..."
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Search
        </button>
        {searchQuery && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              fetchCourses();
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Clear
          </button>
        )}
      </form>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : courses.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {searchQuery ? 'No courses found.' : 'No courses registered yet.'}
        </div>
      ) : (
        <div className="grid gap-4">
      {courses.map((course) => (
        <div
          key={course.id}
          className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
        >
          <Link href={`/courses/${course.id}`}>
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
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold flex-1">{course.title}</h3>
                {course.is_owner && (
                  <div className="flex items-center gap-2 ml-2" onClick={(e) => e.preventDefault()}>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        router.push(`/courses/${course.id}/edit`);
                      }}
                      className="p-1.5 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(course.id, e)}
                      className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
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
                <div className="flex items-center gap-2">
                  {course.user_profile_image_url ? (
                    <img
                      src={course.user_profile_image_url}
                      alt={course.username}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs font-medium">
                      {course.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                  <span className="text-xs">{course.username}</span>
                </div>
              </div>
            </div>
          </Link>
        </div>
      ))}
        </div>
      )}
    </div>
  );
}
