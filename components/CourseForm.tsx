'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleMap, useJsApiLoader, DrawingManager, Polygon } from '@react-google-maps/api';
import { LatLng } from '@/types';
import { compressImage, validateFileSize, validateImageType } from '@/lib/image-utils';

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
  const [courseType, setCourseType] = useState('');
  const [surfaceType, setSurfaceType] = useState('');
  const [elevation, setElevation] = useState('');
  const [trafficLights, setTrafficLights] = useState('');
  const [streetlights, setStreetlights] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingCourse, setLoadingCourse] = useState(isEditMode);
  const polygonRef = useRef<google.maps.Polygon | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries
  });

  // 수정 모드일 때 코스 데이터 로드 - RecordForm 패턴 따라 단순화
  const fetchCourse = async () => {
    if (!courseId) return;
    
    try {
      setError('');
      setLoadingCourse(true);
      const response = await fetch(`/api/courses/${courseId}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to load course');
      }
      
      const course = await response.json();
      
      if (!course) {
        throw new Error('Course data is empty');
      }
      
      // 안전하게 데이터 설정
      setTitle(course.title || '');
      setDescription(course.description || null || '');
      setExistingImageUrl(course.image_url || null);
      setCourseType(course.course_type || null || '');
      setSurfaceType(course.surface_type || null || '');
      setElevation(course.elevation || null || '');
      setTrafficLights(course.traffic_lights || null || '');
      setStreetlights(course.streetlights || null || '');
      
      // path_data 파싱 (안전하게 처리)
      if (course.path_data) {
        try {
          // 이미 객체인 경우와 문자열인 경우 모두 처리
          let pathData: any;
          if (typeof course.path_data === 'string') {
            pathData = JSON.parse(course.path_data);
          } else if (Array.isArray(course.path_data)) {
            pathData = course.path_data;
          } else {
            pathData = null;
          }
          
          // 배열이고 유효한 좌표인지 확인
          if (Array.isArray(pathData) && pathData.length > 0) {
            // 각 좌표의 유효성 검사
            const validPath = pathData.filter((point: any) => {
              if (!point || typeof point !== 'object') return false;
              const lat = point.lat;
              const lng = point.lng;
              return typeof lat === 'number' && 
                     typeof lng === 'number' &&
                     !isNaN(lat) && 
                     !isNaN(lng) &&
                     isFinite(lat) &&
                     isFinite(lng);
            });
            
            if (validPath.length > 0) {
              setPath(validPath);
            } else {
              console.warn('No valid coordinates found in path_data');
              setPath([]);
            }
          } else {
            setPath([]);
          }
        } catch (parseError: any) {
          console.error('Failed to parse path_data:', parseError);
          setPath([]);
          // path_data 파싱 실패는 치명적이지 않으므로 에러로 표시하지 않음
        }
      } else {
        setPath([]);
      }
    } catch (error: any) {
      console.error('Failed to fetch course:', error);
      setError(error?.message || 'Failed to load course. Please try again.');
      // 에러 발생 시에도 로딩 상태는 해제
    } finally {
      setLoadingCourse(false);
    }
  };

  useEffect(() => {
    if (isEditMode && courseId) {
      fetchCourse();
    }
  }, [isEditMode, courseId]);

  const onLoad = useCallback((map: google.maps.Map) => {
    // 맵 로드 완료
  }, []);

  const onUnmount = useCallback(() => {
    // 맵 언마운트
  }, []);

  const onPolygonComplete = useCallback((polygon: google.maps.Polygon) => {
    try {
      // 기존 polygon이 있으면 제거
      if (polygonRef.current) {
        polygonRef.current.setMap(null);
      }
      
      polygonRef.current = polygon;
      const path = polygon.getPath();
      const coordinates: LatLng[] = [];
      
      if (path) {
        path.forEach((latLng) => {
          if (latLng) {
            try {
              const lat = latLng.lat();
              const lng = latLng.lng();
              if (typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)) {
                coordinates.push({ lat, lng });
              }
            } catch (err) {
              console.warn('Error getting lat/lng:', err);
            }
          }
        });
      }

      if (coordinates.length > 0) {
        setPath(coordinates);
      }
    } catch (error) {
      console.error('Error processing polygon:', error);
      setError('Failed to process course path. Please try again.');
    }
  }, []);

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
        setError(''); // 에러 메시지 초기화
      } catch (err) {
        console.error('이미지 압축 실패:', err);
        setError('이미지 처리 중 오류가 발생했습니다');
        e.target.value = '';
      }
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
      if (courseType) formData.append('course_type', courseType);
      if (surfaceType) formData.append('surface_type', surfaceType);
      if (elevation) formData.append('elevation', elevation);
      if (trafficLights) formData.append('traffic_lights', trafficLights);
      if (streetlights) formData.append('streetlights', streetlights);
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
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
        <p className="text-gray-500">Loading course...</p>
      </div>
    );
  }

  if (error && !loadingCourse) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-red-700 font-medium mb-2">Error loading course</p>
          <p className="text-red-600 text-sm mb-4">{error}</p>
          <button
            onClick={() => {
              setError('');
              setLoadingCourse(true);
              fetchCourse();
            }}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-red-700 font-medium mb-2">Map loading error</p>
          <p className="text-red-600 text-sm">{loadError.message || 'Failed to load Google Maps'}</p>
          <p className="text-xs text-red-500 mt-2">Please check your Google Maps API key in environment variables.</p>
        </div>
      </div>
    );
  }

  // center 계산 (안전하게 처리) - 일반 함수로 변경 (useMemo 제거)
  const getMapCenter = (): { lat: number; lng: number } => {
    if (path.length > 0) {
      const midIndex = Math.floor(path.length / 2);
      const midPoint = path[midIndex];
      if (midPoint && typeof midPoint.lat === 'number' && typeof midPoint.lng === 'number') {
        return { lat: midPoint.lat, lng: midPoint.lng };
      }
    }
    return defaultCenter;
  };

  const mapCenter = getMapCenter();

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
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:border-black"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          코스 경로 그리기 *
        </label>
        <p className="text-sm text-gray-500 mb-2">
          지도에서 다각형 도구를 사용하여 코스 경로를 그려주세요.
        </p>
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={mapCenter}
            zoom={13}
            onLoad={onLoad}
            onUnmount={onUnmount}
            options={{
              zoomControl: true,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: true,
            }}
          >
            {typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.drawing && (
              <DrawingManager
                onPolygonComplete={onPolygonComplete}
                options={{
                  drawingMode: window.google.maps.drawing.OverlayType.POLYGON,
                  drawingControl: true,
                  drawingControlOptions: {
                    position: window.google.maps.ControlPosition.TOP_CENTER,
                    drawingModes: [window.google.maps.drawing.OverlayType.POLYGON],
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
            )}
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
        ) : (
          <div className="w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-4"></div>
              <div className="text-gray-500">Loading map...</div>
            </div>
          </div>
        )}
        {path.length > 0 && (
          <p className="mt-2 text-sm text-gray-600">
            거리: {calculateDistance(path).toFixed(2)} km
          </p>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Course Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="courseType" className="block text-sm font-medium text-gray-700 mb-2">
              Course Type
            </label>
            <select
              id="courseType"
              value={courseType}
              onChange={(e) => setCourseType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:border-black"
            >
              <option value="">Select</option>
              <option value="Round Trip">Round Trip</option>
              <option value="One Way">One Way</option>
              <option value="Loop">Loop</option>
            </select>
          </div>

          <div>
            <label htmlFor="surfaceType" className="block text-sm font-medium text-gray-700 mb-2">
              Surface Type
            </label>
            <select
              id="surfaceType"
              value={surfaceType}
              onChange={(e) => setSurfaceType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:border-black"
            >
              <option value="">Select</option>
              <option value="Road">Road</option>
              <option value="Trail">Trail</option>
              <option value="Beach">Beach</option>
              <option value="Track">Track</option>
            </select>
          </div>

          <div>
            <label htmlFor="elevation" className="block text-sm font-medium text-gray-700 mb-2">
              Elevation
            </label>
            <select
              id="elevation"
              value={elevation}
              onChange={(e) => setElevation(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:border-black"
            >
              <option value="">Select</option>
              <option value="Flat">Flat</option>
              <option value="Some">Some</option>
              <option value="Very Much">Very Much</option>
            </select>
          </div>

          <div>
            <label htmlFor="trafficLights" className="block text-sm font-medium text-gray-700 mb-2">
              Traffic Lights
            </label>
            <select
              id="trafficLights"
              value={trafficLights}
              onChange={(e) => setTrafficLights(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:border-black"
            >
              <option value="">Select</option>
              <option value="None">None</option>
              <option value="1-2">1-2</option>
              <option value="3-4">3-4</option>
              <option value="Very Many">Very Many</option>
            </select>
          </div>

          <div>
            <label htmlFor="streetlights" className="block text-sm font-medium text-gray-700 mb-2">
              Streetlights
            </label>
            <select
              id="streetlights"
              value={streetlights}
              onChange={(e) => setStreetlights(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:border-black"
            >
              <option value="">Select</option>
              <option value="None">None</option>
              <option value="Moderate">Moderate</option>
              <option value="Bright">Bright</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Course Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:border-black"
        />
      </div>

      <div>
        <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
          Course Image
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:border-black"
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
          className="flex-1 px-4 py-2 bg-white border border-black text-black rounded hover:bg-black hover:text-white transition-colors"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-black text-white px-4 py-2 rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (isEditMode ? '수정 중...' : '등록 중...') : (isEditMode ? '수정하기' : '등록하기')}
        </button>
      </div>
    </form>
  );
}
