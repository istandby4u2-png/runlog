'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleMap, useJsApiLoader, DrawingManager, Polygon } from '@react-google-maps/api';
import { LatLng } from '@/types';

const libraries: ("drawing")[] = ["drawing"];

const containerStyle = {
  width: '100%',
  height: '400px'
};

const defaultCenter = {
  lat: 37.5665,
  lng: 126.9780
};

interface CourseFormProps {
  courseId?: number;
}

export function CourseForm({ courseId }: CourseFormProps) {
  const router = useRouter();
  const isEditMode = !!courseId;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [path, setPath] = useState<LatLng[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingCourse, setLoadingCourse] = useState(isEditMode);
  const polygonRef = useRef<google.maps.Polygon | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries
  });

  // 수정 모드일 때 코스 데이터 로드
  const fetchCourse = useCallback(async () => {
    if (!courseId) return;
    
    try {
      const response = await fetch(`/api/courses/${courseId}`);
      if (!response.ok) {
        throw new Error('Failed to load course');
      }
      const course = await response.json();
      
      setTitle(course.title || '');
      setDescription(course.description || '');
      setExistingImageUrl(course.image_url || null);
      
      // path_data 파싱 (안전하게 처리)
      if (course.path_data) {
        try {
          // 이미 객체인 경우와 문자열인 경우 모두 처리
          const pathData = typeof course.path_data === 'string' 
            ? JSON.parse(course.path_data) 
            : course.path_data;
          
          // 배열이고 유효한 좌표인지 확인
          if (Array.isArray(pathData) && pathData.length > 0) {
            setPath(pathData);
          }
        } catch (parseError) {
          console.error('Failed to parse path_data:', parseError);
          setPath([]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch course:', error);
      setError('Failed to load course. Please try again.');
    } finally {
      setLoadingCourse(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (isEditMode && courseId) {
      fetchCourse();
    }
  }, [isEditMode, courseId, fetchCourse]);

  const onLoad = useCallback((map: google.maps.Map) => {
    // 맵 로드 완료
  }, []);

  const onUnmount = useCallback(() => {
    // 맵 언마운트
  }, []);

  const onPolygonComplete = useCallback((polygon: google.maps.Polygon) => {
    polygonRef.current = polygon;
    const path = polygon.getPath();
    const coordinates: LatLng[] = [];
    
    path.forEach((latLng) => {
      coordinates.push({
        lat: latLng.lat(),
        lng: latLng.lng()
      });
    });

    setPath(coordinates);
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const calculateDistance = (coordinates: LatLng[]): number => {
    if (coordinates.length < 2) return 0;
    
    let totalDistance = 0;
    for (let i = 0; i < coordinates.length - 1; i++) {
      const lat1 = coordinates[i].lat;
      const lng1 = coordinates[i].lng;
      const lat2 = coordinates[i + 1].lat;
      const lng2 = coordinates[i + 1].lng;
      
      const R = 6371; // 지구 반경 (km)
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      totalDistance += R * c;
    }
    
    return totalDistance;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('코스 제목을 입력해주세요.');
      return;
    }

    if (path.length < 2) {
      setError('지도에 코스 경로를 그려주세요.');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('path_data', JSON.stringify(path));
      formData.append('distance', calculateDistance(path).toFixed(2));
      if (image) {
        formData.append('image', image);
      }
      if (removeImage) {
        formData.append('remove_image', 'true');
      }

      const url = isEditMode ? `/api/courses/${courseId}` : '/api/courses';
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        router.push('/courses');
        router.refresh();
      } else {
        setError(data.error || (isEditMode ? '코스 수정에 실패했습니다.' : '코스 등록에 실패했습니다.'));
      }
    } catch (err) {
      setError('코스 등록 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingCourse) {
    return <div className="text-center py-8 text-gray-500">Loading course...</div>;
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Loading map...</div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          코스 제목 *
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          required
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          코스 설명
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          코스 경로 그리기 *
        </label>
        <p className="text-sm text-gray-500 mb-2">
          지도에서 다각형 도구를 사용하여 코스 경로를 그려주세요.
        </p>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={path.length > 0 ? path[Math.floor(path.length / 2)] : defaultCenter}
          zoom={path.length > 0 ? 13 : 13}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={{
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
          }}
        >
          <DrawingManager
            onPolygonComplete={onPolygonComplete}
            options={{
              drawingMode: google.maps.drawing.OverlayType.POLYGON,
              drawingControl: true,
              drawingControlOptions: {
                position: google.maps.ControlPosition.TOP_CENTER,
                drawingModes: [google.maps.drawing.OverlayType.POLYGON],
              },
              polygonOptions: {
                fillColor: '#0ea5e9',
                fillOpacity: 0.2,
                strokeWeight: 3,
                strokeColor: '#0284c7',
                clickable: false,
                editable: true,
                zIndex: 1,
              },
            }}
          />
          {path.length > 0 && (
            <Polygon
              paths={path}
              options={{
                fillColor: '#0ea5e9',
                fillOpacity: 0.2,
                strokeWeight: 3,
                strokeColor: '#0284c7',
                editable: true,
                draggable: false,
              }}
            />
          )}
        </GoogleMap>
        {path.length > 0 && (
          <p className="mt-2 text-sm text-gray-600">
            거리: {calculateDistance(path).toFixed(2)} km
          </p>
        )}
      </div>

      <div>
        <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
          코스 이미지
        </label>
        {existingImageUrl && !removeImage && (
          <div className="mb-4">
            <div className="w-full h-48 bg-gray-200 rounded-lg overflow-hidden mb-2">
              <img
                src={existingImageUrl}
                alt="Current course image"
                className="w-full h-full object-cover"
              />
            </div>
            <button
              type="button"
              onClick={() => setRemoveImage(true)}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Remove Image
            </button>
          </div>
        )}
        {(!existingImageUrl || removeImage) && (
          <input
            type="file"
            id="image"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        )}
        {image && (
          <p className="mt-2 text-sm text-gray-600">{image.name}</p>
        )}
        {removeImage && (
          <button
            type="button"
            onClick={() => {
              setRemoveImage(false);
              setImage(null);
            }}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
          >
            Cancel Remove
          </button>
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
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (isEditMode ? '수정 중...' : '등록 중...') : (isEditMode ? '수정하기' : '등록하기')}
        </button>
      </div>
    </form>
  );
}
