export type Visibility = 'public' | 'loggers' | 'private';

export interface User {
  id: number;
  username: string;
  email: string;
  profile_image_url?: string | null;
  bio?: string | null;
  height?: number | null; // in cm (private)
  weight?: number | null; // in kg (private)
  gender?: 'male' | 'female' | 'other' | null; // (private)
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
  course_type?: string | null;
  surface_type?: string | null;
  elevation?: string | null;
  traffic_lights?: string | null;
  streetlights?: string | null;
  visibility?: Visibility;
  created_at: string;
  username?: string;
  user_profile_image_url?: string | null;
  likes_count?: number;
  comments_count?: number;
  is_liked?: boolean;
  is_owner?: boolean;
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
  calories?: number; // Pre-run meal calories
  meal_timing_hours?: number;
  burned_calories?: number; // Calories burned during run
  sleep_hours?: number;
  sleep_quality?: string;
  visibility?: Visibility;
  created_at: string;
  username?: string;
  user_profile_image_url?: string | null;
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
