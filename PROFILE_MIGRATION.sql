-- 프로필 이미지 필드 추가
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
