-- Add visibility and bio columns for privacy control and user profile enhancement
-- Run this SQL in Supabase SQL Editor

-- 1. Add visibility column to running_records
ALTER TABLE running_records
ADD COLUMN visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'loggers', 'private'));

COMMENT ON COLUMN running_records.visibility IS 'Visibility setting: public (all), loggers (logged-in users), private (owner only)';

-- 2. Add visibility column to courses
ALTER TABLE courses
ADD COLUMN visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'loggers', 'private'));

COMMENT ON COLUMN courses.visibility IS 'Visibility setting: public (all), loggers (logged-in users), private (owner only)';

-- 3. Add bio column to users
ALTER TABLE users
ADD COLUMN bio TEXT;

COMMENT ON COLUMN users.bio IS 'User bio/introduction text';

-- 4. Create index for visibility filtering (performance optimization)
CREATE INDEX idx_running_records_visibility ON running_records(visibility);
CREATE INDEX idx_courses_visibility ON courses(visibility);
