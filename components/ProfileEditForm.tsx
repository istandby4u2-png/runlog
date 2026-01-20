'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/types';
import { compressImage, validateImageType } from '@/lib/image-utils';
import { LogoutButton } from './LogoutButton';

interface ProfileEditFormProps {
  user: User;
}

export function ProfileEditForm({ user }: ProfileEditFormProps) {
  const router = useRouter();
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio || '');
  const [height, setHeight] = useState(user.height?.toString() || '');
  const [weight, setWeight] = useState(user.weight?.toString() || '');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | ''>(user.gender || '');
  const [image, setImage] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type
      if (!validateImageType(file)) {
        setError('Only image files are allowed (JPEG, PNG, GIF, WebP)');
        e.target.value = '';
        return;
      }
      
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Image size must be less than 10MB');
        e.target.value = '';
        return;
      }

      try {
        // Compress image
        const compressed = await compressImage(file, 800, 800, 0.8);
        setImage(compressed);
        setRemoveImage(false);
        setError('');
        console.log('✅ Image compressed successfully');
      } catch (error) {
        console.error('❌ Image compression failed:', error);
        setError('Failed to compress image');
      }
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('username', username);
      formData.append('bio', bio);
      formData.append('height', height);
      formData.append('weight', weight);
      formData.append('gender', gender);
      
      if (image) {
        formData.append('image', image);
      }
      if (removeImage) {
        formData.append('remove_image', 'true');
      }

      const response = await fetch('/api/profile', {
        method: 'PUT',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Profile updated successfully!');
        setTimeout(() => {
          router.push('/profile');
          router.refresh();
        }, 1500);
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('An error occurred while updating profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All password fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    setChangingPassword(true);

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Password changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(data.error || 'Failed to change password');
      }
    } catch (err) {
      setError('An error occurred while changing password');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <form onSubmit={handleProfileUpdate} className="bg-white rounded border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-black mb-4">Profile Information</h2>
        
        {/* Profile Image */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Profile Image
          </label>
          {user.profile_image_url && !removeImage && !image && (
            <div className="relative mb-4">
              <img
                src={user.profile_image_url}
                alt="Current profile"
                className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
              />
              <button
                type="button"
                onClick={() => setRemoveImage(true)}
                className="mt-2 px-3 py-1 bg-white border border-black text-black rounded hover:bg-black hover:text-white transition-colors text-sm"
              >
                Remove Image
              </button>
            </div>
          )}
          {image && (
            <div className="mb-4">
              <img
                src={URL.createObjectURL(image)}
                alt="Preview"
                className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
              />
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-black focus:border-black"
          />
        </div>

        {/* Username */}
        <div className="mb-4">
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
            Username *
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-black focus:border-black"
          />
        </div>

        {/* Bio */}
        <div className="mb-4">
          <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
            Bio
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            maxLength={500}
            placeholder="Tell us about yourself..."
            className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-black focus:border-black resize-none"
          />
          <p className="mt-1 text-xs text-gray-500">
            {bio.length}/500 characters
          </p>
        </div>

        {/* Physical Profile (Private) */}
        <div className="mb-4 p-4 border border-gray-200 rounded bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-black">Physical Profile</h3>
            <p className="text-xs text-gray-600 italic">🔒 해당 정보는 나만 볼 수 있습니다.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Height */}
            <div>
              <label htmlFor="height" className="block text-sm font-medium text-gray-700 mb-1">
                Height (cm)
              </label>
              <input
                type="number"
                id="height"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="170"
                min="0"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-black focus:border-black"
              />
            </div>

            {/* Weight */}
            <div>
              <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">
                Weight (kg)
              </label>
              <input
                type="number"
                id="weight"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="65"
                min="0"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-black focus:border-black"
              />
            </div>

            {/* Gender */}
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                Gender
              </label>
              <select
                id="gender"
                value={gender}
                onChange={(e) => setGender(e.target.value as 'male' | 'female' | 'other' | '')}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-black focus:border-black"
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-500">
            This information is used to calculate calories burned during runs.
          </p>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded text-sm">{error}</div>}
        {success && <div className="mb-4 p-3 bg-green-50 text-green-700 rounded text-sm">{success}</div>}

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-4 py-2 bg-white border border-black text-black rounded hover:bg-black hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-black text-white px-4 py-2 rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Password Change */}
      <form onSubmit={handlePasswordChange} className="bg-white rounded border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-black mb-4">Change Password</h2>

        <div className="mb-4">
          <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
            Current Password *
          </label>
          <input
            type="password"
            id="currentPassword"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-black focus:border-black"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
            New Password *
          </label>
          <input
            type="password"
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-black focus:border-black"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
            Confirm New Password *
          </label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-black focus:border-black"
          />
        </div>

        <button
          type="submit"
          disabled={changingPassword}
          className="w-full bg-black text-white px-4 py-2 rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {changingPassword ? 'Changing Password...' : 'Change Password'}
        </button>
      </form>

      {/* Logout */}
      <div className="bg-white rounded border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-black mb-4">Account</h2>
        <LogoutButton />
      </div>
    </div>
  );
}
