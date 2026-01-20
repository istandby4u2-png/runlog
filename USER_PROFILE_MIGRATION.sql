-- Add height, weight, and gender columns to users table
-- These are private fields for calorie calculation

ALTER TABLE users
ADD COLUMN height REAL,
ADD COLUMN weight REAL,
ADD COLUMN gender TEXT CHECK (gender IN ('male', 'female', 'other'));

COMMENT ON COLUMN users.height IS 'User height in centimeters (private field)';
COMMENT ON COLUMN users.weight IS 'User weight in kilograms (private field)';
COMMENT ON COLUMN users.gender IS 'User gender for calorie calculations (private field)';

-- Add burned_calories column to running_records table
ALTER TABLE running_records
ADD COLUMN burned_calories INTEGER;

COMMENT ON COLUMN running_records.burned_calories IS 'Estimated calories burned during the run (kcal)';
