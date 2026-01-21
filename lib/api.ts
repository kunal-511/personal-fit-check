import type {
  DailyNutrition,
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

  logMeal: (data: MealFormData & { date?: string }) =>
    fetcher<{ success: boolean; meal_id: number }>("/nutrition/meals", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  deleteMeal: (id: number) =>
    fetcher<{ success: boolean }>(`/nutrition/meals?id=${id}`, {
      method: "DELETE",
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
        confidence: number
      }>
      totals?: {
        calories: number
        protein: number
        carbs: number
        fats: number
      }
      parsed_text?: string
    }>("/nutrition/parse", {
      method: "POST",
      body: JSON.stringify({ text }),
    }),
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

  create: (data: WorkoutFormData & { date?: string; duration_minutes?: number }) =>
    fetcher<{ success: boolean; workout_id: number }>("/workouts", {
      method: "POST",
      body: JSON.stringify(data),
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
