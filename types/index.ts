export interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

export interface Course {
  id: number;
  user_id: number;
  title: string;
  description?: string;
  path_data: string; // JSON string of coordinates
  image_url?: string;
  distance?: number;
  created_at: string;
  username?: string;
  likes_count?: number;
  comments_count?: number;
  is_liked?: boolean;
}

export interface RunningRecord {
  id: number;
  user_id: number;
  course_id?: number;
  title: string;
  content?: string;
  image_url?: string;
  distance?: number;
  duration?: number;
  record_date: string;
  weather?: string;
  mood?: string;
  meal?: string;
  calories?: number;
  sleep_hours?: number;
  sleep_quality?: string;
  created_at: string;
  username?: string;
  course_title?: string;
  likes_count?: number;
  comments_count?: number;
  is_liked?: boolean;
  is_owner?: boolean;
}

export interface Comment {
  id: number;
  user_id: number;
  course_id?: number;
  record_id?: number;
  content: string;
  created_at: string;
  username?: string;
}

export interface Like {
  id: number;
  user_id: number;
  course_id?: number;
  record_id?: number;
  created_at: string;
}

export interface LatLng {
  lat: number;
  lng: number;
}
