'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Course, RunningRecord, Visibility } from '@/types';
import { compressImage, validateFileSize, validateImageType } from '@/lib/image-utils';

interface RecordFormProps {
  recordId?: number;
}

export function RecordForm({ recordId }: RecordFormProps) {
  const router = useRouter();
  const isEditMode = !!recordId;
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [courseId, setCourseId] = useState<string>('');
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [recordDate, setRecordDate] = useState(new Date().toISOString().split('T')[0]);
  const [weather, setWeather] = useState('');
  const [mood, setMood] = useState('');
  const [meal, setMeal] = useState('');
  const [calories, setCalories] = useState<number | null>(null);
  const [mealTimingHours, setMealTimingHours] = useState('');
  const [calculatingCalories, setCalculatingCalories] = useState(false);
  const [calorieError, setCalorieError] = useState<string | null>(null);
  const [sleepHours, setSleepHours] = useState('');
  const [sleepQuality, setSleepQuality] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingRecord, setLoadingRecord] = useState(isEditMode);

  const weatherOptions = [
    { value: '☀️', label: '☀️ 맑음' },
    { value: '☁️', label: '☁️ 흐림' },
    { value: '☔️', label: '☔️ 비' },
    { value: '⛄️', label: '⛄️ 눈' },
    { value: '🌪️', label: '🌪️ 바람' },
    { value: '⛅️', label: '⛅️ 구름 많음' },
  ];

  const moodOptions = [
    { value: '😃', label: '😃' },
    { value: '🥹', label: '🥹' },
    { value: '😂', label: '😂' },
    { value: '🤣', label: '🤣' },
    { value: '😇', label: '😇' },
    { value: '☺️', label: '☺️' },
    { value: '🙂', label: '🙂' },
    { value: '🙃', label: '🙃' },
    { value: '🥰', label: '🥰' },
    { value: '😞', label: '😞' },
    { value: '😔', label: '😔' },
    { value: '😡', label: '😡' },
    { value: '🤯', label: '🤯' },
    { value: '🥵', label: '🥵' },
    { value: '🥶', label: '🥶' },
    { value: '😨', label: '😨' },
    { value: '🫠', label: '🫠' },
    { value: '🥱', label: '🥱' },
    { value: '🤮', label: '🤮' },
    { value: '🤒', label: '🤒' },
    { value: '👏', label: '👏' },
    { value: '👍', label: '👍' },
    { value: '💪', label: '💪' },
    { value: '😭', label: '😭' },
  ];

  useEffect(() => {
    fetchCourses();
    if (isEditMode && recordId) {
      fetchRecord();
    }
  }, [isEditMode, recordId]);

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/courses');
      const data = await response.json();
      setCourses(data);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    }
  };

  const fetchRecord = async () => {
    if (!recordId) return;
    
    try {
      const response = await fetch(`/api/records/${recordId}`);
      if (!response.ok) {
        throw new Error('기록을 불러올 수 없습니다.');
      }
      const record: RunningRecord = await response.json();
      
      setTitle(record.title);
      setContent(record.content || '');
      setRecordDate(record.record_date);
      setCourseId(record.course_id?.toString() || '');
      setDistance(record.distance?.toString() || '');
      setDuration(record.duration?.toString() || '');
      setWeather(record.weather || '');
      setMood(record.mood || '');
      setMeal(record.meal || '');
      setCalories(record.calories || null);
      setMealTimingHours(record.meal_timing_hours?.toString() || '');
      setSleepHours(record.sleep_hours?.toString() || '');
      setSleepQuality(record.sleep_quality || '');
      setVisibility(record.visibility || 'public');
      setExistingImageUrl(record.image_url || null);
    } catch (error) {
      console.error('Failed to fetch record:', error);
      setError('기록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoadingRecord(false);
    }
  };

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

  const handleMealChange = async (value: string) => {
    setMeal(value);
    setCalorieError(null);
    
    // 식사 내용이 입력되면 자동으로 칼로리 계산
    if (value.trim()) {
      setCalculatingCalories(true);
      try {
        console.log('칼로리 계산 요청:', value); // 디버깅
        
        const response = await fetch('/api/calories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ meal: value }),
        });

        console.log('API 응답 상태:', response.status); // 디버깅

        if (response.ok) {
          const data = await response.json();
          console.log('API 응답 데이터:', data); // 디버깅
          
          if (data.calories !== null && data.calories !== undefined) {
            setCalories(data.calories);
            setCalorieError(null);
            console.log('칼로리 계산 성공:', data.calories); // 디버깅
          } else {
            setCalories(null);
            setCalorieError('칼로리를 계산할 수 없습니다. API 응답을 확인해주세요.');
            console.error('칼로리 데이터 없음:', data); // 디버깅
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          setCalories(null);
          let errorMessage = errorData.error || `서버 오류 (${response.status})`;
          
          // details 필드가 있으면 추가 정보 표시
          if (errorData.details) {
            errorMessage += `\n${errorData.details}`;
          }
          
          // 더 자세한 에러 정보를 콘솔에 출력
          console.error('❌ API 오류 상세:', {
            status: response.status,
            statusText: response.statusText,
            error: errorData.error,
            details: errorData.details,
            fullError: errorData
          });
          
          setCalorieError(errorMessage);
        }
      } catch (error) {
        console.error('칼로리 계산 실패:', error);
        setCalories(null);
        setCalorieError('칼로리 계산 중 오류가 발생했습니다. 네트워크 연결과 API 키를 확인해주세요.');
      } finally {
        setCalculatingCalories(false);
      }
    } else {
      setCalories(null);
      setCalorieError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title.trim()) {
      setError('제목을 입력해주세요.');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      formData.append('record_date', recordDate);
      if (courseId) {
        formData.append('course_id', courseId);
      }
      if (distance) {
        formData.append('distance', distance);
      }
      if (duration) {
        formData.append('duration', duration);
      }
      if (image) {
        formData.append('image', image);
      }
      if (weather) {
        formData.append('weather', weather);
      }
      if (mood) {
        formData.append('mood', mood);
      }
      if (meal) {
        formData.append('meal', meal);
      }
      if (calories !== null) {
        formData.append('calories', calories.toString());
      }
      if (mealTimingHours) {
        formData.append('meal_timing_hours', mealTimingHours);
      }
      if (sleepHours) {
        formData.append('sleep_hours', sleepHours);
      }
      if (sleepQuality) {
        formData.append('sleep_quality', sleepQuality);
      }
      formData.append('visibility', visibility);
      if (removeImage) {
        formData.append('remove_image', 'true');
      }

      const url = isEditMode ? `/api/records/${recordId}` : '/api/records';
      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        router.push('/');
        router.refresh();
      } else {
        setError(data.error || (isEditMode ? '기록 수정에 실패했습니다.' : '기록 등록에 실패했습니다.'));
      }
    } catch (err) {
      setError('기록 등록 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingRecord) {
    return <div className="text-center py-8 text-gray-500">Loading...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          Title *
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
        <label htmlFor="recordDate" className="block text-sm font-medium text-gray-700 mb-2">
          Date *
        </label>
        <input
          type="date"
          id="recordDate"
          value={recordDate}
          onChange={(e) => setRecordDate(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:border-black"
          required
        />
      </div>

      <div>
        <label htmlFor="courseId" className="block text-sm font-medium text-gray-700 mb-2">
          Course (Optional)
        </label>
        <select
          id="courseId"
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:border-black"
        >
          <option value="">Select a course</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="distance" className="block text-sm font-medium text-gray-700 mb-2">
            Distance (km)
          </label>
          <input
            type="number"
            id="distance"
            step="0.01"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:border-black"
          />
        </div>
        <div>
          <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
            Duration (min)
          </label>
          <input
            type="number"
            id="duration"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:border-black"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="weather" className="block text-sm font-medium text-gray-700 mb-2">
            Weather
          </label>
          <select
            id="weather"
            value={weather}
            onChange={(e) => setWeather(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:border-black text-lg"
          >
            <option value="">Select</option>
            {weatherOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="mood" className="block text-sm font-medium text-gray-700 mb-2">
            Mood
          </label>
          <select
            id="mood"
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:border-black text-lg"
          >
            <option value="">Select</option>
            {moodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="visibility" className="block text-sm font-medium text-gray-700 mb-2">
            Visibility
          </label>
          <select
            id="visibility"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as Visibility)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:border-black"
          >
            <option value="public">🌍 Public</option>
            <option value="loggers">👥 Loggers Only</option>
            <option value="private">🔒 Private</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Pre-run Meal */}
        <div className="lg:col-span-2">
          <label htmlFor="meal" className="block text-sm font-medium text-gray-700 mb-2">
            Pre-run Meal
          </label>
          <input
            type="text"
            id="meal"
            value={meal}
            onChange={(e) => handleMealChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:border-black"
            placeholder="예: 치킨 샐러드, 바나나 2개, 단백질 쉐이크"
          />
          <p className="mt-1 text-xs text-gray-500">
            Calories will be automatically calculated
          </p>
          {calorieError && !calculatingCalories && (
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-xs text-yellow-700">{calorieError}</p>
            </div>
          )}
        </div>

        {/* Total Calories */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Total Calories
          </label>
          <div className="h-[42px] flex items-center justify-center px-4 py-2 border border-gray-300 rounded bg-white">
            {calculatingCalories ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black"></div>
                <span className="text-sm text-gray-700 font-medium">계산 중...</span>
              </div>
            ) : calories !== null ? (
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-black">{calories.toLocaleString()}</span>
                <span className="text-sm font-medium text-gray-600">kcal</span>
              </div>
            ) : (
              <span className="text-sm text-gray-400">-</span>
            )}
          </div>
        </div>

        {/* Hours Before Run */}
        <div>
          <label htmlFor="mealTimingHours" className="block text-sm font-medium text-gray-700 mb-2">
            Hours Before
          </label>
          <input
            type="number"
            id="mealTimingHours"
            value={mealTimingHours}
            onChange={(e) => setMealTimingHours(e.target.value)}
            step="0.5"
            min="0"
            max="24"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:border-black"
            placeholder="2"
          />
          <p className="mt-1 text-xs text-gray-500">
            Hours before run
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="sleep_hours" className="block text-sm font-medium text-gray-700 mb-2">
            Sleep Hours
          </label>
          <input
            type="number"
            id="sleep_hours"
            step="0.5"
            min="0"
            max="24"
            value={sleepHours}
            onChange={(e) => setSleepHours(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:border-black"
            placeholder="Hours"
          />
        </div>
        <div>
          <label htmlFor="sleep_quality" className="block text-sm font-medium text-gray-700 mb-2">
            Sleep Quality
          </label>
          <select
            id="sleep_quality"
            value={sleepQuality}
            onChange={(e) => setSleepQuality(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:border-black"
          >
            <option value="">Select</option>
            <option value="deep">Deep Sleep</option>
            <option value="woke_once">Woke Once</option>
            <option value="woke_multiple">Woke 2+ Times</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
          Content
        </label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:border-black"
          placeholder="How was your run today?"
        />
      </div>

      <div>
        <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
          Photo
        </label>
        {existingImageUrl && !removeImage && (
          <div className="mb-2 relative">
            <img
              src={existingImageUrl}
              alt="Current"
              className="w-full h-48 object-cover rounded-lg"
            />
            <button
              type="button"
              onClick={() => {
                setRemoveImage(true);
                setExistingImageUrl(null);
              }}
              className="absolute top-2 right-2 bg-white border border-black text-black px-3 py-1 rounded text-sm hover:bg-black hover:text-white transition-colors"
            >
              Delete
            </button>
          </div>
        )}
        <input
          type="file"
          id="image"
          accept="image/*"
          onChange={handleImageChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-black focus:border-black"
        />
        {image && (
          <div className="mt-2">
            <img
              src={URL.createObjectURL(image)}
              alt="Preview"
              className="w-full h-48 object-cover rounded-lg"
            />
          </div>
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
          disabled={loading || loadingRecord}
          className="flex-1 bg-black text-white px-4 py-2 rounded hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (isEditMode ? 'Updating...' : 'Saving...') : (isEditMode ? 'Update' : 'Save')}
        </button>
      </div>
    </form>
  );
}
