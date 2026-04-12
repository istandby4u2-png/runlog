-- picked_photos: stores photos selected via Google Photos Picker API
CREATE TABLE IF NOT EXISTS picked_photos (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  photo_date DATE NOT NULL,
  blob_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, photo_date)
);
