// ============================================
// User Types
// ============================================

export interface UserProfile {
  id: number
  user_id: string
  height_cm: number | null
  weight_kg: number | null
  date_of_birth: string | null
  gender: "male" | "female" | "other" | null
  activity_level: "sedentary" | "lightly_active" | "moderately_active" | "very_active" | "extra_active" | null
  created_at: string
}

// ============================================
// Nutrition Types
// ============================================

export interface NutritionGoals {
  id: number
  user_id: string
  daily_calories: number
  protein_g: number
  carbs_g: number
  fats_g: number
  water_ml: number
  updated_at: string
}

export type MealType = "breakfast" | "lunch" | "dinner" | "snack"

export interface Meal {
  id: number
  user_id: string
  date: string
  meal_type: MealType
  meal_name: string | null
  notes: string | null
  logged_at: string
  food_items?: FoodItem[]
  totals?: {
    calories: number
    protein: number
    carbs: number
    fats: number
  }
}

export interface FoodItem {
  id: number
  meal_id: number
  food_name: string
  name?: string // Alias for food_name used in API responses
  quantity: number
  unit: string
  calories: number
  protein_g: number
  protein?: number // Alias for protein_g
  carbs_g: number
  carbs?: number // Alias for carbs_g
  fats_g: number
  fats?: number // Alias for fats_g
  fiber_g: number | null
  sugar_g: number | null
  sodium_mg: number | null
  vitamin_c_mg: number | null
  vitamin_d_mcg: number | null
  calcium_mg: number | null
  iron_mg: number | null
}

export interface WaterLog {
  id: number
  user_id: string
  date: string
  amount_ml: number
  logged_at: string
}

export interface DailyNutrition {
  date: string
  totals: {
    calories: number
    protein: number
    carbs: number
    fats: number
    water: number
  }
  goals: NutritionGoals
  meals: Meal[]
  percentages: {
    calories: number
    protein: number
    carbs: number
    fats: number
    water: number
  }
}

// ============================================
// Workout Types
// ============================================

export type WorkoutType = "strength" | "cardio"

export interface Workout {
  id: number
  user_id: string
  date: string
  workout_type: WorkoutType
  title: string
  duration_minutes: number | null
  total_volume: number | null
  notes: string | null
  started_at: string | null
  completed_at: string | null
  exercises?: Exercise[]
}

export interface Exercise {
  id: number
  workout_id: number
  exercise_name: string
  muscle_group: string | null
  sets_completed: number
  target_sets: number
  weight_kg: number | null
  notes: string | null
  sets?: ExerciseSet[]
}

export interface ExerciseSet {
  id: number
  exercise_id: number
  set_number: number
  reps: number
  weight_kg: number
  rest_seconds: number | null
  rpe: number | null // Rate of Perceived Exertion (1-10)
}

export type CardioType = "running" | "cycling" | "rowing" | "swimming" | "walking" | "elliptical" | "other"

export interface CardioSession {
  id: number
  user_id: string
  date: string
  cardio_type: CardioType
  duration_minutes: number
  distance_km: number | null
  avg_heart_rate: number | null
  calories_burned: number | null
  notes: string | null
  logged_at: string
}

// ============================================
// Health Metrics Types
// ============================================

export interface BodyMetrics {
  id: number
  user_id: string
  date: string
  weight_kg: number | null
  body_fat_percent: number | null
  chest_cm: number | null
  waist_cm: number | null
  hips_cm: number | null
  left_arm_cm: number | null
  right_arm_cm: number | null
  left_thigh_cm: number | null
  right_thigh_cm: number | null
  notes: string | null
  logged_at: string
}

export type PhotoCategory = "front" | "side" | "back"

export interface ProgressPhoto {
  id: number
  user_id: string
  date: string
  photo_url: string
  category: PhotoCategory
  notes: string | null
  uploaded_at: string
}

export interface SleepLog {
  id: number
  user_id: string
  date: string
  bedtime: string | null
  wake_time: string | null
  hours_slept: number
  quality_rating: 1 | 2 | 3 | 4 | 5
  notes: string | null
  logged_at: string
}

export interface HeartRateLog {
  id: number
  user_id: string
  date: string
  resting_hr: number | null
  avg_hr: number | null
  max_hr: number | null
  measured_at: string
}

export interface RecoveryScore {
  id: number
  user_id: string
  date: string
  recovery_score: number // 0-100
  sleep_score: number | null
  hrv_score: number | null
  muscle_soreness: 1 | 2 | 3 | 4 | 5 | null
  energy_level: 1 | 2 | 3 | 4 | 5 | null
  calculated_at: string
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// ============================================
// Form Types
// ============================================

export interface MealFormData {
  meal_type: MealType
  meal_name?: string
  notes?: string
  food_items: Omit<FoodItem, "id" | "meal_id">[]
}

export interface WorkoutFormData {
  workout_type: WorkoutType
  title: string
  notes?: string
  exercises: {
    exercise_name: string
    muscle_group?: string
    target_sets: number
    sets: {
      reps: number
      weight_kg: number
      rest_seconds?: number
      rpe?: number
    }[]
  }[]
}

export interface BodyMetricsFormData {
  weight_kg?: number
  body_fat_percent?: number
  chest_cm?: number
  waist_cm?: number
  hips_cm?: number
  left_arm_cm?: number
  right_arm_cm?: number
  left_thigh_cm?: number
  right_thigh_cm?: number
  notes?: string
}

// ============================================
// UI Types
// ============================================

export interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
}

export interface ChartDataPoint {
  date: string
  value: number
  label?: string
}

export interface MacroData {
  current: number
  target: number
  label: string
  color: "protein" | "carbs" | "fats"
}
