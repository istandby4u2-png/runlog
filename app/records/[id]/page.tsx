import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getUserFromRequest } from '@/lib/auth';
import { runningRecords } from '@/lib/db-supabase';
import { format } from 'date-fns';
import { MapPin, Clock, Edit, ArrowLeft } from 'lucide-react';
import { CommentSection } from '@/components/CommentSection';
import { InstagramShare } from '@/components/InstagramShare';
import { LikeButton } from '@/components/LikeButton';

export const dynamic = 'force-dynamic';

export default async function RecordDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const recordId = parseInt(params.id);

  if (isNaN(recordId)) {
    notFound();
  }

  const user = await getUserFromRequest();
  const record = await runningRecords.findById(recordId, user?.id || null);

  if (!record) {
    notFound();
  }

  return (
    <main className="container mx-auto px-4 py-6 max-w-3xl">
      {/* Back Button */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-black mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Feed</span>
      </Link>

      {/* Record Card */}
      <div className="bg-white rounded border border-gray-200 overflow-hidden">
        {record.image_url && (
          <div className="w-full h-96 bg-gray-200 relative">
            <img
              src={record.image_url}
              alt={record.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 flex items-center gap-3">
              {record.user_profile_image_url ? (
                <img
                  src={record.user_profile_image_url}
                  alt={record.username}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-sm font-medium">
                  {record.username?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-black">{record.title}</h1>
                <p className="text-sm text-gray-500">
                  {record.username} · {format(new Date(record.record_date), 'yyyy.M.d')}
                </p>
              </div>
            </div>

            {/* Edit Button (only for owner) */}
            {record.is_owner && (
              <Link
                href={`/records/${record.id}/edit`}
                className="flex items-center gap-1 px-3 py-2 bg-white border border-black text-black rounded hover:bg-black hover:text-white transition-colors text-sm"
              >
                <Edit className="w-4 h-4" />
                <span>Edit</span>
              </Link>
            )}
          </div>

          {/* Weather & Mood */}
          {(record.weather || record.mood) && (
            <div className="flex items-center gap-4 mb-4">
              {record.weather && (
                <span className="text-3xl" title="Weather">
                  {record.weather}
                </span>
              )}
              {record.mood && (
                <span className="text-3xl" title="Mood">
                  {record.mood}
                </span>
              )}
            </div>
          )}

          {/* Content */}
          {record.content && (
            <p className="text-gray-700 mb-6 whitespace-pre-wrap leading-relaxed">
              {record.content}
            </p>
          )}

          {/* Run Details */}
          <div className="flex flex-wrap gap-4 mb-6 text-sm">
            {record.distance && (
              <div className="flex items-center gap-1 text-gray-600">
                <MapPin className="w-4 h-4" />
                <span className="font-medium">{record.distance.toFixed(2)} km</span>
              </div>
            )}
            {record.duration && (
              <div className="flex items-center gap-1 text-gray-600">
                <Clock className="w-4 h-4" />
                <span className="font-medium">
                  {Math.floor(record.duration / 60)}:{(record.duration % 60).toString().padStart(2, '0')}
                </span>
              </div>
            )}
            {record.burned_calories && (
              <div className="flex items-center gap-1 font-medium text-black">
                <span>🔥 -{record.burned_calories.toLocaleString()} kcal</span>
              </div>
            )}
            {record.course_title && (
              <Link
                href={`/courses/${record.course_id}`}
                className="flex items-center gap-1 text-black hover:underline font-medium"
              >
                <MapPin className="w-4 h-4" />
                <span>{record.course_title}</span>
              </Link>
            )}
          </div>

          {/* Pre-run Meal */}
          {record.meal && (
            <div className="mb-4 p-4 bg-white border border-gray-300 rounded">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-black mb-1">Pre-run Meal</p>
                  <p className="text-sm text-gray-700">{record.meal}</p>
                  {record.meal_timing_hours !== null && (
                    <p className="text-xs text-gray-600 mt-1">
                      🕐 {record.meal_timing_hours}{' '}
                      {record.meal_timing_hours === 1 ? 'hour' : 'hours'} before
                    </p>
                  )}
                </div>
                {record.calories && (
                  <div className="ml-4 text-right">
                    <p className="text-xs text-gray-600 mb-1">Calories</p>
                    <p className="text-lg font-bold text-black">
                      {record.calories.toLocaleString()} kcal
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sleep */}
          {(record.sleep_hours || record.sleep_quality) && (
            <div className="mb-4 p-4 bg-white border border-gray-300 rounded">
              <p className="text-sm font-medium text-black mb-2">Sleep</p>
              <div className="flex items-center gap-4">
                {record.sleep_hours !== null && (
                  <div className="flex items-center gap-1">
                    <span className="text-lg">😴</span>
                    <span className="text-sm text-gray-700">
                      {record.sleep_hours} hours
                    </span>
                  </div>
                )}
                {record.sleep_quality && (
                  <div className="flex items-center gap-1">
                    <span className="text-lg">{record.sleep_quality}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
            <LikeButton
              recordId={record.id}
              initialIsLiked={record.is_liked || false}
              initialLikesCount={record.likes_count || 0}
            />
            <button className="flex items-center gap-2 text-gray-400 hover:text-black transition-colors">
              <span className="text-lg">💬</span>
              <span className="text-sm font-medium">
                {record.comments_count || 0}
              </span>
            </button>
            <InstagramShare record={record} />
          </div>
        </div>
      </div>

      {/* Comments Section */}
      <div className="mt-6">
        <CommentSection recordId={record.id} />
      </div>
    </main>
  );
}
