/**
 * Calculate calories burned during running based on distance, duration, and user profile
 * Uses MET (Metabolic Equivalent of Task) values for running
 */

interface CalorieCalculationParams {
  distance: number; // in km
  duration: number; // in minutes
  weight: number; // in kg
  gender?: 'male' | 'female' | 'other' | null;
}

/**
 * Get MET value based on running speed
 * @param speed - Speed in km/h
 * @returns MET value
 */
function getMETForSpeed(speed: number): number {
  if (speed < 8) return 8; // Light jogging
  if (speed < 9.7) return 9; // 8-9.7 km/h
  if (speed < 11.3) return 10; // 9.7-11.3 km/h
  if (speed < 12.9) return 11; // 11.3-12.9 km/h
  if (speed < 14.5) return 12.5; // 12.9-14.5 km/h
  return 14; // 14.5+ km/h (fast running)
}

/**
 * Calculate calories burned during running
 * Formula: Calories = MET × weight(kg) × duration(hours)
 * 
 * @param params - Calculation parameters
 * @returns Estimated calories burned (kcal)
 */
export function calculateBurnedCalories(params: CalorieCalculationParams): number {
  const { distance, duration, weight } = params;

  // Validate inputs
  if (!distance || !duration || !weight || distance <= 0 || duration <= 0 || weight <= 0) {
    return 0;
  }

  // Calculate speed in km/h
  const durationInHours = duration / 60;
  const speed = distance / durationInHours;

  // Get MET value based on speed
  const met = getMETForSpeed(speed);

  // Calculate calories: MET × weight(kg) × duration(hours)
  const calories = met * weight * durationInHours;

  // Round to nearest integer
  return Math.round(calories);
}

/**
 * Estimate if user has sufficient profile data for calorie calculation
 */
export function canCalculateBurnedCalories(
  distance?: number | null,
  duration?: number | null,
  weight?: number | null
): boolean {
  return !!(distance && duration && weight && distance > 0 && duration > 0 && weight > 0);
}
