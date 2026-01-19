-- Add meal_timing_hours column to running_records table
-- This column stores the number of hours before the run that the meal was consumed

ALTER TABLE running_records
ADD COLUMN meal_timing_hours REAL;

COMMENT ON COLUMN running_records.meal_timing_hours IS 'Hours before the run that the pre-run meal was consumed';
