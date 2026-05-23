import type {
  DailyNutrition,
  Meal,
  MealFormData,
  Workout,
  WorkoutFormData,
  BodyMetrics,
  BodyMetricsFormData,
  CardioSession,
} from "@/types"

const API_BASE = "/api"

async function fetcher<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Request failed" }))
    throw new Error(error.error || "Request failed")
  }

  return res.json()
}

// ============================================
// Nutrition API
// ============================================

export const nutritionApi = {
  getDaily: (date?: string) =>
    fetcher<DailyNutrition>(
      `/nutrition/daily${date ? `?date=${date}` : ""}`
    ),

  getRecentMeals: (limit = 5) =>
    fetcher<{ meals: Array<Pick<Meal, "id" | "date" | "meal_type" | "meal_name" | "notes" | "logged_at" | "totals">> }>(
      `/nutrition/recent?limit=${limit}`
    ),

  logMeal: (data: MealFormData & { date?: string }) =>
    fetcher<{ success: boolean; meal_id: number }>("/nutrition/meals", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  deleteMeal: (id: number) =>
    fetcher<{ success: boolean }>(`/nutrition/meals?id=${id}`, {
      method: "DELETE",
    }),

  updateMeal: (data: {
    id: number
    meal_name?: string
    meal_type?: string
    food_items?: Array<{
      food_name: string
      quantity: number
      unit: string
      calories: number
      protein_g: number
      carbs_g: number
      fats_g: number
    }>
  }) =>
    fetcher<{ success: boolean }>("/nutrition/meals", {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  getWater: (date?: string) =>
    fetcher<{ date: string; total: number; entries: number; logs: Array<{ id: number; amount_ml: number; logged_at: string }> }>(
      `/nutrition/water${date ? `?date=${date}` : ""}`
    ),

  logWater: (amount_ml: number, date?: string) =>
    fetcher<{ success: boolean; id: number; total: number }>("/nutrition/water", {
      method: "POST",
      body: JSON.stringify({ amount_ml, date }),
    }),

  parseFood: (text: string) =>
    fetcher<{
      success: boolean
      message?: string
      foods: Array<{
        name: string
        quantity: number
        unit: string
        calories: number
        protein: number
        carbs: number
        fats: number
        fiber?: number
        confidence: number
      }>
      totals?: {
        calories: number
        protein: number
        carbs: number
        fats: number
      }
      parsed_text?: string
      source?: string
    }>("/nutrition/parse", {
      method: "POST",
      body: JSON.stringify({ text }),
    }),

  parseFoodImage: async (file: File) => {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
    return fetcher<{
      success: boolean
      message?: string
      foods: Array<{
        name: string
        quantity: number
        unit: string
        calories: number
        protein: number
        carbs: number
        fats: number
        fiber?: number
        confidence: number
      }>
      totals?: {
        calories: number
        protein: number
        carbs: number
        fats: number
      }
      source?: string
    }>("/nutrition/parse", {
      method: "POST",
      body: JSON.stringify({ image: base64, mimeType: file.type }),
    })
  },

  getFrequentFoods: (limit = 6, meal_type?: string) =>
    fetcher<{
      foods: Array<{
        name: string
        unit: string
        calories: number
        protein: number
        carbs: number
        fats: number
        use_count: number
        last_used_at: string
      }>
    }>(`/nutrition/foods/frequent?limit=${limit}${meal_type ? `&meal_type=${meal_type}` : ""}`),

  getGoals: () =>
    fetcher<{
      goals: {
        daily_calories: number
        protein_g: number
        carbs_g: number
        fats_g: number
        water_ml: number
      }
    }>("/nutrition/goals"),

  updateGoals: (goals: {
    daily_calories: number
    protein_g: number
    carbs_g: number
    fats_g: number
    water_ml: number
  }) =>
    fetcher<{ success: boolean }>("/nutrition/goals", {
      method: "POST",
      body: JSON.stringify(goals),
    }),

  getNutritionHistory: (days = 7) =>
    fetcher<{
      history: Array<{
        date: string
        day: string
        shortDate: string
        calories: number
        protein: number
        carbs: number
        fats: number
      }>
      goals: { calories: number; protein: number; carbs: number; fats: number }
      averages: { calories: number; protein: number; carbs: number; fats: number }
    }>(`/nutrition/history?days=${days}`),
}

// ============================================
// Workouts API
// ============================================

export const workoutsApi = {
  getAll: (limit?: number) =>
    fetcher<{ workouts: Workout[] }>(
      `/workouts${limit ? `?limit=${limit}` : ""}`
    ),

  getById: (id: string) =>
    fetcher<{ workout: Workout | null }>(`/workouts/${id}`),

  getByDate: (date: string) =>
    fetcher<{ workouts: Workout[] }>(`/workouts?date=${date}`),

  getFrequentExercises: (limit?: number) =>
    fetcher<{
      exercises: Array<{
        exercise_name: string
        muscle_group: string | null
        count: number
        last_used: string
      }>
    }>(`/workouts/frequent${limit ? `?limit=${limit}` : ""}`),

  create: (data: WorkoutFormData & { date?: string; duration_minutes?: number }) =>
    fetcher<{ success: boolean; workout_id: number }>("/workouts", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Set operations
  updateSet: (setId: number, data: { reps?: number; weight_kg?: number; rpe?: number }) =>
    fetcher<{ success: boolean; set: { id: number; reps: number; weight_kg: number; rpe: number | null } }>(
      `/workouts/sets/${setId}`,
      {
        method: "PATCH",
        body: JSON.stringify(data),
      }
    ),

  deleteSet: (setId: number) =>
    fetcher<{ success: boolean }>(`/workouts/sets/${setId}`, {
      method: "DELETE",
    }),

  // Cardio sessions
  getCardioSessions: (limit?: number) =>
    fetcher<{ sessions: CardioSession[] }>(
      `/workouts/cardio${limit ? `?limit=${limit}` : ""}`
    ),

  logCardio: (data: {
    cardio_type: string
    duration_minutes: number
    distance_km?: number
    avg_heart_rate?: number
    calories_burned?: number
    notes?: string
    date?: string
  }) =>
    fetcher<{ success: boolean; session_id: number }>("/workouts/cardio", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateWorkout: (id: number, data: { title?: string; notes?: string; duration_minutes?: number }) =>
    fetcher<{ success: boolean }>(`/workouts/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteWorkout: (id: number) =>
    fetcher<{ success: boolean }>(`/workouts/${id}`, {
      method: "DELETE",
    }),

  addExercise: (workoutId: number, data: {
    exercise_name: string
    muscle_group?: string
    sets: Array<{ reps: number; weight_kg: number; rpe?: number }>
  }) =>
    fetcher<{ success: boolean; exercise: { id: number; exercise_name: string; muscle_group: string | null; target_sets: number; sets_completed: number; weight_kg: number | null; notes: string | null } }>(
      `/workouts/${workoutId}/exercises`,
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    ),

  deleteExercise: (exerciseId: number) =>
    fetcher<{ success: boolean }>(`/workouts/exercises/${exerciseId}`, {
      method: "DELETE",
    }),

  getCalendar: (month: string) =>
    fetcher<{
      workouts: Record<
        string,
        Array<{
          id: number
          title: string
          workout_type: string
          duration_minutes: number | null
        }>
      >
    }>(`/workouts/calendar?month=${month}`),

  getExerciseHistory: (exerciseName: string, limit?: number) =>
    fetcher<{
      exercise_name: string
      sessions: Array<{
        workout_id: number
        date: string
        workout_title: string
        exercise_notes: string | null
        sets: Array<{ set_number: number; weight_kg: number; reps: number; rpe: number | null }>
        total_volume: number
        max_weight: number
      }>
      personal_record: { weight: number; reps: number; date: string } | null
      total_sessions: number
    }>(
      `/workouts/exercise-history?exercise=${encodeURIComponent(exerciseName)}${limit ? `&limit=${limit}` : ""}`
    ),
}

// ============================================
// Health API
// ============================================

export const healthApi = {
  getBodyMetrics: (days?: number) =>
    fetcher<{
      latest: BodyMetrics | null
      history: BodyMetrics[]
      changes: { weight: number; body_fat: number } | null
    }>(`/health/body${days ? `?days=${days}` : ""}`),

  saveBodyMetrics: (data: BodyMetricsFormData & { date?: string }) =>
    fetcher<{ success: boolean; id: number }>("/health/body", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getRecovery: (date?: string) =>
    fetcher<{
      date: string
      recovery: {
        recovery_score: number
        sleep_score: number | null
        hrv_score: number | null
        muscle_soreness: number | null
        energy_level: number | null
      } | null
      sleep: {
        hours_slept: number
        quality_rating: number
      } | null
      heartRate: {
        resting_hr: number
        hrv_score: number
      } | null
      history: Array<{
        date: string
        recovery_score: number
      }>
    }>(`/health/recovery${date ? `?date=${date}` : ""}`),

  saveRecovery: (data: {
    recovery_score: number
    sleep_score?: number
    hrv_score?: number
    muscle_soreness?: number
    energy_level?: number
    date?: string
  }) =>
    fetcher<{ success: boolean; id: number }>("/health/recovery", {
      method: "POST",
      body: JSON.stringify(data),
    }),
}
