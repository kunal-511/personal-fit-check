import { create } from "zustand"
import type { BodyMetrics, SleepLog, RecoveryScore, HeartRateLog, ProgressPhoto, PhotoCategory } from "@/types"

// ============================================
// Health Data Store - Manages health metrics state
// ============================================

interface BodyMetricsData {
  latest: BodyMetrics | null
  history: BodyMetrics[]
  changes: { weight: number; body_fat: number } | null
  isLoading: boolean
  error: string | null
}

interface SleepData {
  latest: SleepLog | null
  history: SleepLog[]
  averageHours: number
  averageQuality: number
  isLoading: boolean
  error: string | null
}

interface RecoveryData {
  today: RecoveryScore | null
  history: RecoveryScore[]
  heartRate: HeartRateLog | null
  sleep: SleepLog | null
  isLoading: boolean
  error: string | null
}

interface ProgressPhotosData {
  photos: ProgressPhoto[]
  groupedByDate: Record<string, ProgressPhoto[]>
  isLoading: boolean
  isUploading: boolean
  error: string | null
}

interface HealthStore {
  // Body Metrics
  bodyMetrics: BodyMetricsData
  fetchBodyMetrics: (days?: number) => Promise<void>
  saveBodyMetrics: (data: Partial<BodyMetrics>) => Promise<boolean>

  // Sleep
  sleep: SleepData
  fetchSleep: (days?: number) => Promise<void>
  saveSleep: (data: Partial<SleepLog>) => Promise<boolean>

  // Recovery
  recovery: RecoveryData
  fetchRecovery: (date?: string, days?: number) => Promise<void>
  saveRecovery: (data: Partial<RecoveryScore>) => Promise<boolean>
  saveHeartRate: (data: Partial<HeartRateLog>) => Promise<boolean>

  // Progress Photos
  progressPhotos: ProgressPhotosData
  fetchProgressPhotos: (days?: number, category?: PhotoCategory) => Promise<void>
  uploadProgressPhoto: (file: File, category: PhotoCategory, date?: string, notes?: string) => Promise<boolean>
  deleteProgressPhoto: (id: number) => Promise<boolean>

  // Reset
  reset: () => void
}

export const useHealthStore = create<HealthStore>((set, get) => ({
  // ============================================
  // Body Metrics
  // ============================================
  bodyMetrics: {
    latest: null,
    history: [],
    changes: null,
    isLoading: false,
    error: null,
  },

  fetchBodyMetrics: async (days = 30) => {
    set((state) => ({
      bodyMetrics: { ...state.bodyMetrics, isLoading: true, error: null },
    }))

    try {
      const response = await fetch(`/api/health/body?days=${days}`)
      if (!response.ok) throw new Error("Failed to fetch body metrics")

      const data = await response.json()
      set({
        bodyMetrics: {
          latest: data.latest,
          history: data.history || [],
          changes: data.changes,
          isLoading: false,
          error: null,
        },
      })
    } catch (error) {
      set((state) => ({
        bodyMetrics: {
          ...state.bodyMetrics,
          isLoading: false,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      }))
    }
  },

  saveBodyMetrics: async (data) => {
    try {
      const response = await fetch("/api/health/body", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error("Failed to save body metrics")

      // Refresh data after save
      await get().fetchBodyMetrics()
      return true
    } catch (error) {
      console.error("Error saving body metrics:", error)
      return false
    }
  },

  // ============================================
  // Sleep
  // ============================================
  sleep: {
    latest: null,
    history: [],
    averageHours: 0,
    averageQuality: 0,
    isLoading: false,
    error: null,
  },

  fetchSleep: async (days = 7) => {
    set((state) => ({
      sleep: { ...state.sleep, isLoading: true, error: null },
    }))

    try {
      const response = await fetch(`/api/health/sleep?days=${days}`)
      if (!response.ok) throw new Error("Failed to fetch sleep data")

      const data = await response.json()
      const history = data.history || []

      // Calculate averages
      const totalHours = history.reduce((sum: number, log: SleepLog) => sum + (log.hours_slept || 0), 0)
      const totalQuality = history.reduce((sum: number, log: SleepLog) => sum + (log.quality_rating || 0), 0)
      const count = history.length || 1

      set({
        sleep: {
          latest: data.latest,
          history,
          averageHours: Math.round((totalHours / count) * 10) / 10,
          averageQuality: Math.round((totalQuality / count) * 10) / 10,
          isLoading: false,
          error: null,
        },
      })
    } catch (error) {
      set((state) => ({
        sleep: {
          ...state.sleep,
          isLoading: false,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      }))
    }
  },

  saveSleep: async (data) => {
    try {
      const response = await fetch("/api/health/sleep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error("Failed to save sleep data")

      // Refresh data after save
      await get().fetchSleep()
      return true
    } catch (error) {
      console.error("Error saving sleep data:", error)
      return false
    }
  },

  // ============================================
  // Recovery
  // ============================================
  recovery: {
    today: null,
    history: [],
    heartRate: null,
    sleep: null,
    isLoading: false,
    error: null,
  },

  fetchRecovery: async (date, days = 7) => {
    set((state) => ({
      recovery: { ...state.recovery, isLoading: true, error: null },
    }))

    try {
      const params = new URLSearchParams()
      if (date) params.append("date", date)
      params.append("days", days.toString())

      const response = await fetch(`/api/health/recovery?${params}`)
      if (!response.ok) throw new Error("Failed to fetch recovery data")

      const data = await response.json()
      set({
        recovery: {
          today: data.recovery,
          history: data.history || [],
          heartRate: data.heartRate,
          sleep: data.sleep,
          isLoading: false,
          error: null,
        },
      })
    } catch (error) {
      set((state) => ({
        recovery: {
          ...state.recovery,
          isLoading: false,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      }))
    }
  },

  saveRecovery: async (data) => {
    try {
      const response = await fetch("/api/health/recovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error("Failed to save recovery data")

      // Refresh data after save
      await get().fetchRecovery()
      return true
    } catch (error) {
      console.error("Error saving recovery data:", error)
      return false
    }
  },

  saveHeartRate: async (data) => {
    try {
      const response = await fetch("/api/health/heart-rate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error("Failed to save heart rate data")

      // Refresh recovery data after save
      await get().fetchRecovery()
      return true
    } catch (error) {
      console.error("Error saving heart rate:", error)
      return false
    }
  },

  // ============================================
  // Progress Photos
  // ============================================
  progressPhotos: {
    photos: [],
    groupedByDate: {},
    isLoading: false,
    isUploading: false,
    error: null,
  },

  fetchProgressPhotos: async (days = 90, category) => {
    set((state) => ({
      progressPhotos: { ...state.progressPhotos, isLoading: true, error: null },
    }))

    try {
      const params = new URLSearchParams()
      params.append("days", days.toString())
      if (category) params.append("category", category)

      const response = await fetch(`/api/health/photos?${params}`)
      if (!response.ok) throw new Error("Failed to fetch progress photos")

      const data = await response.json()
      set({
        progressPhotos: {
          photos: data.photos || [],
          groupedByDate: data.groupedByDate || {},
          isLoading: false,
          isUploading: false,
          error: null,
        },
      })
    } catch (error) {
      set((state) => ({
        progressPhotos: {
          ...state.progressPhotos,
          isLoading: false,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      }))
    }
  },

  uploadProgressPhoto: async (file, category, date, notes) => {
    set((state) => ({
      progressPhotos: { ...state.progressPhotos, isUploading: true, error: null },
    }))

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("category", category)
      if (date) formData.append("date", date)
      if (notes) formData.append("notes", notes)

      const response = await fetch("/api/health/photos", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to upload photo")
      }

      // Refresh photos after upload
      await get().fetchProgressPhotos()
      return true
    } catch (error) {
      set((state) => ({
        progressPhotos: {
          ...state.progressPhotos,
          isUploading: false,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      }))
      return false
    }
  },

  deleteProgressPhoto: async (id) => {
    try {
      const response = await fetch(`/api/health/photos/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete photo")

      // Refresh photos after delete
      await get().fetchProgressPhotos()
      return true
    } catch (error) {
      console.error("Error deleting progress photo:", error)
      return false
    }
  },

  // Reset all health data
  reset: () => {
    set({
      bodyMetrics: {
        latest: null,
        history: [],
        changes: null,
        isLoading: false,
        error: null,
      },
      sleep: {
        latest: null,
        history: [],
        averageHours: 0,
        averageQuality: 0,
        isLoading: false,
        error: null,
      },
      recovery: {
        today: null,
        history: [],
        heartRate: null,
        sleep: null,
        isLoading: false,
        error: null,
      },
      progressPhotos: {
        photos: [],
        groupedByDate: {},
        isLoading: false,
        isUploading: false,
        error: null,
      },
    })
  },
}))

// ============================================
// Helper functions for recovery calculations
// ============================================

export function calculateRecoveryScore(params: {
  sleepHours?: number
  sleepQuality?: number // 1-5
  hrvScore?: number // ms
  restingHr?: number // bpm
  muscleSoreness?: number // 1-5 (1=none, 5=extreme)
  energyLevel?: number // 1-5
}): number {
  const {
    sleepHours = 7,
    sleepQuality = 3,
    hrvScore,
    restingHr,
    muscleSoreness = 3,
    energyLevel = 3,
  } = params

  // Sleep component (40% of score)
  // Optimal sleep is 7-9 hours
  let sleepScore = 0
  if (sleepHours >= 7 && sleepHours <= 9) {
    sleepScore = 100
  } else if (sleepHours >= 6 && sleepHours < 7) {
    sleepScore = 80
  } else if (sleepHours >= 5 && sleepHours < 6) {
    sleepScore = 60
  } else if (sleepHours > 9 && sleepHours <= 10) {
    sleepScore = 85
  } else {
    sleepScore = 40
  }
  // Adjust by quality
  sleepScore = sleepScore * (sleepQuality / 5)

  // HRV component (20% if available)
  let hrvComponent = 70 // Default if not available
  if (hrvScore !== undefined) {
    // Higher HRV generally indicates better recovery
    // Typical range 20-100ms
    if (hrvScore >= 70) hrvComponent = 100
    else if (hrvScore >= 50) hrvComponent = 80
    else if (hrvScore >= 30) hrvComponent = 60
    else hrvComponent = 40
  }

  // Resting HR component (10% if available)
  let hrComponent = 70 // Default if not available
  if (restingHr !== undefined) {
    // Lower resting HR generally indicates better fitness
    if (restingHr <= 55) hrComponent = 100
    else if (restingHr <= 65) hrComponent = 85
    else if (restingHr <= 75) hrComponent = 70
    else hrComponent = 50
  }

  // Muscle soreness component (15%)
  // Lower soreness = better recovery
  const sorenessScore = (6 - muscleSoreness) / 5 * 100

  // Energy level component (15%)
  const energyScore = energyLevel / 5 * 100

  // Calculate weighted average
  const totalScore = Math.round(
    sleepScore * 0.4 +
    hrvComponent * 0.2 +
    hrComponent * 0.1 +
    sorenessScore * 0.15 +
    energyScore * 0.15
  )

  return Math.max(0, Math.min(100, totalScore))
}

export function getRecoveryRecommendation(score: number): {
  status: "excellent" | "good" | "moderate" | "low"
  message: string
  color: string
} {
  if (score >= 80) {
    return {
      status: "excellent",
      message: "You're fully recovered! Great day for high-intensity training.",
      color: "text-green-500",
    }
  } else if (score >= 60) {
    return {
      status: "good",
      message: "Good recovery. You can proceed with your planned workout.",
      color: "text-primary",
    }
  } else if (score >= 40) {
    return {
      status: "moderate",
      message: "Moderate recovery. Consider a lighter workout or active recovery.",
      color: "text-amber-500",
    }
  } else {
    return {
      status: "low",
      message: "Low recovery. Rest day recommended. Focus on sleep and nutrition.",
      color: "text-red-500",
    }
  }
}
