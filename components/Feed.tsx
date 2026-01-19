'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { RunningRecord } from '@/types';
import { Heart, MessageCircle, MapPin, Clock, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { CommentSection } from './CommentSection';
import { InstagramShare } from './InstagramShare';

export function Feed() {
  const router = useRouter();
  const [records, setRecords] = useState<RunningRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      setError(null);
      
      // 타임아웃 설정 (10초)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch('/api/records', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `서버 오류: ${response.status}`);
      }

      const data = await response.json();
      setRecords(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch records:', error);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          setError('요청 시간이 초과되었습니다. 서버가 응답하지 않습니다.');
        } else {
          setError(error.message || '기록을 불러오는 중 오류가 발생했습니다.');
        }
      } else {
        setError('기록을 불러오는 중 오류가 발생했습니다.');
      }
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (recordId: number) => {
    try {
      const response = await fetch(`/api/likes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ record_id: recordId }),
      });

      if (response.ok) {
        fetchRecords();
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  const handleDelete = async (recordId: number) => {
    if (!confirm('정말 이 기록을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/records/${recordId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchRecords();
      } else {
        const data = await response.json();
        alert(data.error || '삭제에 실패했습니다.');
      }
    } catch (error) {
      console.error('Failed to delete record:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-red-700 font-medium mb-2">오류 발생</p>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <button
            onClick={fetchRecords}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        아직 등록된 기록이 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {records.map((record) => (
        <div
          key={record.id}
          className="bg-white rounded border border-gray-200 overflow-hidden"
        >
          {record.image_url && (
            <div className="w-full h-64 bg-gray-200 relative">
              <img
                src={record.image_url}
                alt={record.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div className="p-4">
            <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 flex items-center gap-2">
                    {record.user_profile_image_url ? (
                      <img
                        src={record.user_profile_image_url}
                        alt={record.username}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs font-medium">
                        {record.username?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold">{record.title}</h3>
                      <p className="text-sm text-gray-500">
                        {record.username} · {format(new Date(record.record_date), 'yyyy.M.d')}
                      </p>
                    </div>
                  </div>
              {(record.weather || record.mood) && (
                <div className="flex items-center gap-2 ml-2">
                  {record.weather && (
                    <span className="text-2xl" title="날씨">
                      {record.weather}
                    </span>
                  )}
                  {record.mood && (
                    <span className="text-2xl" title="기분">
                      {record.mood}
                    </span>
                  )}
                </div>
              )}
            </div>

            {record.course_title && record.course_id && (
              <Link
                href={`/courses/${record.course_id}`}
                className="flex items-center gap-1 text-sm text-primary-600 mb-2 hover:text-primary-800 hover:underline"
              >
                <MapPin className="w-4 h-4" />
                {record.course_title}
              </Link>
            )}

            {(record.distance || record.duration) && (
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                {record.distance && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {record.distance.toFixed(2)} km
                  </span>
                )}
                {record.duration && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {record.duration}분
                  </span>
                )}
              </div>
            )}

            {record.content && (
              <p className="text-gray-700 mb-4 whitespace-pre-wrap">{record.content}</p>
            )}

            {record.meal && (
              <div className="mb-4 p-3 bg-white border border-gray-300 rounded">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-black mb-1">Pre-run Meal</p>
                    <p className="text-sm text-gray-700">{record.meal}</p>
                    {record.meal_timing_hours && (
                      <p className="text-xs text-gray-500 mt-1">
                        🕐 {record.meal_timing_hours} {record.meal_timing_hours === 1 ? 'hour' : 'hours'} before
                      </p>
                    )}
                  </div>
                  {record.calories && (
                    <div className="ml-4 text-right">
                      <p className="text-xs text-gray-500 mb-1">Calories</p>
                      <p className="text-lg font-bold text-black">{record.calories.toLocaleString()} kcal</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(record.sleep_hours || record.sleep_quality) && (
              <div className="mb-4 p-3 bg-white border border-gray-300 rounded">
                <p className="text-sm font-medium text-black mb-2">Sleep</p>
                <div className="flex items-center gap-4">
                  {record.sleep_hours && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Hours</p>
                      <p className="text-sm font-semibold text-black">{record.sleep_hours} hrs</p>
                    </div>
                  )}
                  {record.sleep_quality && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Quality</p>
                      <p className="text-sm font-semibold text-black">
                        {record.sleep_quality === 'deep' ? 'Deep Sleep' :
                         record.sleep_quality === 'woke_once' ? 'Woke Once' :
                         record.sleep_quality === 'woke_multiple' ? 'Woke 2+ Times' :
                         record.sleep_quality}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleLike(record.id)}
                  className={`flex items-center gap-2 ${
                    record.is_liked ? 'text-red-500' : 'text-gray-400'
                  } hover:text-red-500 transition-colors`}
                >
                  <Heart className={`w-5 h-5 ${record.is_liked ? 'fill-current' : ''}`} />
                  <span>{record.likes_count || 0}</span>
                </button>
                <div className="flex items-center gap-2 text-gray-400">
                  <MessageCircle className="w-5 h-5" />
                  <span>{record.comments_count || 0}</span>
                </div>
                <InstagramShare record={record} />
              </div>
              {record.is_owner && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => router.push(`/records/${record.id}/edit`)}
                    className="flex items-center gap-1 px-2 py-1 bg-white border border-black text-black hover:bg-black hover:text-white transition-colors text-sm rounded"
                    title="수정"
                  >
                    <Edit className="w-4 h-4" />
                    <span className="hidden sm:inline">수정</span>
                  </button>
                  <button
                    onClick={() => handleDelete(record.id)}
                    className="flex items-center gap-1 px-2 py-1 bg-white border border-black text-black hover:bg-black hover:text-white transition-colors text-sm rounded"
                    title="삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">삭제</span>
                  </button>
                </div>
              )}
            </div>

            <CommentSection recordId={record.id} />
          </div>
        </div>
      ))}
    </div>
  );
}
