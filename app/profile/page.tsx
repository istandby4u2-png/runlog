import { redirect } from 'next/navigation';
import { getUserFromRequest } from '@/lib/auth';
import Link from 'next/link';
import { Edit, MapPin, Activity, Calendar } from 'lucide-react';
import { runningRecords, courses } from '@/lib/db-supabase';

// This page is dynamic
export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const user = await getUserFromRequest();

  if (!user) {
    redirect('/login');
  }

  // Fetch user stats
  const [allRecords, allCourses] = await Promise.all([
    runningRecords.findAll(user.id),
    courses.findAll(user.id)
  ]);

  // Filter user's own records and courses
  const userRecords = allRecords.filter(r => r.user_id === user.id);
  const userCourses = allCourses.filter(c => c.user_id === user.id);

  // Calculate total distance
  const totalDistance = userRecords.reduce((sum, record) => {
    return sum + (record.distance || 0);
  }, 0);

  // Format join date
  const joinDate = new Date(user.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long'
  });

  return (
    <main className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Profile Header */}
      <div className="bg-white rounded border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            {/* Profile Image */}
            {user.profile_image_url ? (
              <img
                src={user.profile_image_url}
                alt={user.username}
                className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                <span className="text-3xl font-bold text-gray-600">
                  {user.username.charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            {/* Username and Join Date */}
            <div>
              <h1 className="text-2xl font-bold text-black">{user.username}</h1>
              <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                <Calendar className="w-4 h-4" />
                <span>Joined {joinDate}</span>
              </div>
            </div>
          </div>

          {/* Edit Button */}
          <Link
            href="/profile/edit"
            className="flex items-center gap-1 px-3 py-2 bg-white border border-black text-black rounded hover:bg-black hover:text-white transition-colors text-sm"
          >
            <Edit className="w-4 h-4" />
            <span>Edit Profile</span>
          </Link>
        </div>

        {/* Bio */}
        {user.bio && (
          <div className="mb-6">
            <p className="text-gray-700 whitespace-pre-wrap">{user.bio}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-200">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Activity className="w-5 h-5 text-gray-600" />
              <p className="text-2xl font-bold text-black">{userRecords.length}</p>
            </div>
            <p className="text-sm text-gray-500">Records</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <MapPin className="w-5 h-5 text-gray-600" />
              <p className="text-2xl font-bold text-black">{userCourses.length}</p>
            </div>
            <p className="text-sm text-gray-500">Courses</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-xl">🏃</span>
              <p className="text-2xl font-bold text-black">{totalDistance.toFixed(1)}</p>
            </div>
            <p className="text-sm text-gray-500">Total km</p>
          </div>
        </div>
      </div>

      {/* Recent Records */}
      {userRecords.length > 0 && (
        <div className="bg-white rounded border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-black mb-4">Recent Records</h2>
          <div className="space-y-3">
            {userRecords.slice(0, 5).map((record) => (
              <Link
                key={record.id}
                href={`/records/${record.id}`}
                className="block p-3 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-black">{record.title}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(record.record_date).toLocaleDateString()}
                    </p>
                  </div>
                  {record.distance && (
                    <p className="text-sm font-medium text-gray-600">
                      {record.distance.toFixed(2)} km
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
