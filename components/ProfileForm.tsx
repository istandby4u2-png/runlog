'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/types';
import { Trash2 } from 'lucide-react';
import { compressImage, validateFileSize, validateImageType } from '@/lib/image-utils';

interface ProfileFormProps {
  user: User;
}

export function ProfileForm({ user: initialUser }: ProfileFormProps) {
  const router = useRouter();
  const [username, setUsername] = useState(initialUser.username);
  const [image, setImage] = useState<File | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(initialUser.profile_image_url || null);
  const [removeImage, setRemoveImage] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // 파일 타입 검증
      if (!validateImageType(file)) {
        setError('이미지 파일만 업로드 가능합니다 (JPEG, PNG, GIF, WebP)');
        e.target.value = '';
        return;
      }
      
      // 파일 크기가 10MB를 초과하면 에러
      if (file.size > 10 * 1024 * 1024) {
        setError('이미지 크기는 10MB 이하여야 합니다');
        e.target.value = '';
        return;
      }
      
      try {
        // 이미지 압축 (500KB 이상이면 압축)
        const compressedFile = await compressImage(file, 1920, 1920, 0.8);
        setImage(compressedFile);
        setRemoveImage(false);
        setError(''); // 에러 메시지 초기화
      } catch (err) {
        console.error('이미지 압축 실패:', err);
        setError('이미지 처리 중 오류가 발생했습니다');
        e.target.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Please enter a username.');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('username', username.trim());
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
        router.refresh();
        if (data.user?.profile_image_url) {
          setExistingImageUrl(data.user.profile_image_url);
        } else if (removeImage) {
          setExistingImageUrl(null);
        }
        setImage(null);
        setRemoveImage(false);
        alert('Profile updated successfully!');
      } else {
        setError(data.error || 'Failed to update profile.');
      }
    } catch (err) {
      console.error('Profile update error:', err);
      setError('An error occurred during profile update.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
          Username *
        </label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:border-black"
          required
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          Email
        </label>
        <input
          type="email"
          id="email"
          value={initialUser.email}
          disabled
          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
        />
        <p className="mt-1 text-xs text-gray-500">Email cannot be changed.</p>
      </div>

      <div>
        <label htmlFor="profileImage" className="block text-sm font-medium text-gray-700 mb-2">
          Profile Photo
        </label>
        {existingImageUrl && !removeImage && (
          <div className="mb-2 relative w-32 h-32">
            <img
              src={existingImageUrl}
              alt="Profile"
              className="w-full h-full object-cover rounded-full"
            />
            <button
              type="button"
              onClick={() => {
                setRemoveImage(true);
                setImage(null);
              }}
              className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
              title="Remove image"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
        {!removeImage && (
          <input
            type="file"
            id="profileImage"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:border-black"
          />
        )}
        {image && (
          <p className="mt-2 text-sm text-gray-600">{image.name}</p>
        )}
        {removeImage && (
          <p className="mt-2 text-sm text-red-600">Image will be removed on save.</p>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

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
          {loading ? 'Updating...' : 'Update Profile'}
        </button>
      </div>
    </form>
  );
}
