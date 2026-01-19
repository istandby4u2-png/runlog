'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Course } from '@/types';
import { GoogleMap, useJsApiLoader, Polyline } from '@react-google-maps/api';
import { Heart, MessageCircle, MapPin, ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { CommentSection } from './CommentSection';

const containerStyle = {
  width: '100%',
  height: '400px'
};

interface CourseDetailProps {
  courseId: number;
}

export function CourseDetail({ courseId }: CourseDetailProps) {
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [path, setPath] = useState<{ lat: number; lng: number }[]>([]);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  useEffect(() => {
    fetchCourse();
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      const response = await fetch(`/api/courses/${courseId}`);
      const data = await response.json();
      setCourse(data);
      if (data.path_data) {
        setPath(JSON.parse(data.path_data));
      }
    } catch (error) {
      console.error('Failed to fetch course:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!course) return;
    
    try {
      const response = await fetch('/api/likes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: course.id }),
      });

      if (response.ok) {
        fetchCourse();
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  const handleDelete = async () => {
    if (!course) return;
    
    if (!confirm('Are you sure you want to delete this course?')) {
      return;
    }

    try {
      const response = await fetch(`/api/courses/${course.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/courses');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete course.');
      }
    } catch (error) {
      console.error('Failed to delete course:', error);
      alert('An error occurred while deleting the course.');
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-500">로딩 중...</div>;
  }

  if (!course) {
    return (
      <div className="text-center py-8 text-gray-500">
        코스를 찾을 수 없습니다.
      </div>
    );
  }

  const center = path.length > 0
    ? path[Math.floor(path.length / 2)]
    : { lat: 37.5665, lng: 126.9780 };

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>뒤로</span>
      </button>

      {course.image_url && (
        <div className="w-full h-64 bg-gray-200 rounded-lg overflow-hidden">
          <img
            src={course.image_url}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold mb-2">{course.title}</h1>
        <div className="flex items-center gap-2 mb-4">
          {course.user_profile_image_url ? (
            <img
              src={course.user_profile_image_url}
              alt={course.username}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs font-medium">
              {course.username?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
          <p className="text-sm text-gray-500">
            {course.username} · {new Date(course.created_at).toLocaleDateString('en-US')}
          </p>
        </div>
        {course.description && (
          <p className="text-gray-700 mb-4 whitespace-pre-wrap">{course.description}</p>
        )}
        {course.distance && (
          <div className="flex items-center gap-1 text-primary-600 mb-4">
            <MapPin className="w-5 h-5" />
            <span className="font-medium">{course.distance.toFixed(2)} km</span>
          </div>
        )}
      </div>

      {isLoaded && path.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">코스 경로</h2>
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={center}
            zoom={13}
            options={{
              zoomControl: true,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: true,
            }}
          >
            <Polyline
              path={path}
              options={{
                strokeColor: '#0284c7',
                strokeOpacity: 1,
                strokeWeight: 5,
              }}
            />
          </GoogleMap>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 ${
              course.is_liked ? 'text-red-500' : 'text-gray-500'
            } hover:text-red-500 transition-colors`}
          >
            <Heart className={`w-6 h-6 ${course.is_liked ? 'fill-current' : ''}`} />
            <span className="font-medium">{course.likes_count || 0}</span>
          </button>
          <div className="flex items-center gap-2 text-gray-500">
            <MessageCircle className="w-6 h-6" />
            <span className="font-medium">{course.comments_count || 0}</span>
          </div>
        </div>
        {course.is_owner && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/courses/${course.id}/edit`)}
              className="flex items-center gap-1 text-gray-600 hover:text-primary-600 text-sm"
              title="Edit"
            >
              <Edit className="w-4 h-4" />
              <span className="hidden sm:inline">Edit</span>
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-1 text-gray-600 hover:text-red-600 text-sm"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          </div>
        )}
      </div>

      <CommentSection courseId={course.id} />
    </div>
  );
}
