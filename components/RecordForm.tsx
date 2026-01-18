'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Course, RunningRecord } from '@/types';

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
  const [calculatingCalories, setCalculatingCalories] = useState(false);
  const [calorieError, setCalorieError] = useState<string | null>(null);
  const [sleepHours, setSleepHours] = useState('');
  const [sleepQuality, setSleepQuality] = useState('');
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
      setSleepHours(record.sleep_hours?.toString() || '');
      setSleepQuality(record.sleep_quality || '');
      setExistingImageUrl(record.image_url || null);
    } catch (error) {
      console.error('Failed to fetch record:', error);
      setError('기록을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoadingRecord(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
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
      if (sleepHours) {
        formData.append('sleep_hours', sleepHours);
      }
      if (sleepQuality) {
        formData.append('sleep_quality', sleepQuality);
      }
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
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="weather" className="block text-sm font-medium text-gray-700 mb-2">
            Weather
          </label>
          <select
            id="weather"
            value={weather}
            onChange={(e) => setWeather(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg"
          >
            <option value="">Select</option>
            {moodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="meal" className="block text-sm font-medium text-gray-700 mb-2">
          Pre-run Meal
        </label>
        <div className="space-y-2">
          <input
            type="text"
            id="meal"
            value={meal}
            onChange={(e) => handleMealChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="예: 돼지고기 수육 500g, 김치 한 접시, 깻잎, 청양고추, 와사비, 맥주 300cc"
          />
          {calculatingCalories && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <p className="text-sm text-blue-700">Calculating calories...</p>
            </div>
          )}
          {calories !== null && !calculatingCalories && (
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
              <span className="text-sm font-medium text-green-700">Total Calories:</span>
              <span className="text-xl font-bold text-green-700">{calories.toLocaleString()} kcal</span>
            </div>
          )}
          {calorieError && !calculatingCalories && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-700 whitespace-pre-line">{calorieError}</p>
              <p className="text-xs text-yellow-600 mt-2">
                💡 브라우저 콘솔(F12)에서 더 자세한 에러 정보를 확인할 수 있습니다.
              </p>
            </div>
          )}
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Calories will be automatically calculated when you enter a meal.
        </p>
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
              className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600"
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
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || loadingRecord}
          className="flex-1 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (isEditMode ? 'Updating...' : 'Saving...') : (isEditMode ? 'Update' : 'Save')}
        </button>
      </div>
    </form>
  );
}
