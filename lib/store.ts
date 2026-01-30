import { create } from "zustand"
import { format } from "date-fns"

// ============================================
// App Store - Global UI State
// ============================================

interface AppState {
  // Selected date for all views
  selectedDate: Date
  setSelectedDate: (date: Date) => void

  // Sidebar state
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void

  // Mobile menu
  mobileMenuOpen: boolean
  setMobileMenuOpen: (open: boolean) => void

  // Quick add modal
  quickAddOpen: boolean
  setQuickAddOpen: (open: boolean) => void
  quickAddType: "meal" | "water" | "workout" | "body" | null
  openQuickAdd: (type: "meal" | "water" | "workout" | "body") => void
  closeQuickAdd: () => void
}

export const useAppStore = create<AppState>((set) => ({
  // Date
  selectedDate: new Date(),
  setSelectedDate: (date) => set({ selectedDate: date }),

  // Sidebar
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  // Mobile menu
  mobileMenuOpen: false,
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),

  // Quick add
  quickAddOpen: false,
  setQuickAddOpen: (open) => set({ quickAddOpen: open }),
  quickAddType: null,
  openQuickAdd: (type) => set({ quickAddOpen: true, quickAddType: type }),
  closeQuickAdd: () => set({ quickAddOpen: false, quickAddType: null }),
}))

// ============================================
// Active Workout Store
// ============================================

interface ExerciseSet {
  reps: number
  weight: number
  completed: boolean
}

interface ActiveExercise {
  name: string
  muscleGroup: string
  targetSets: number
  sets: ExerciseSet[]
}

interface ActiveWorkoutState {
  isActive: boolean
  startTime: Date | null
  title: string
  exercises: ActiveExercise[]
  currentExerciseIndex: number
  currentSetIndex: number
  restTimer: number
  isResting: boolean

  // Actions
  startWorkout: (title: string, exercises: Omit<ActiveExercise, "sets">[]) => void
  endWorkout: () => void
  completeSet: (exerciseIndex: number, setIndex: number, reps: number, weight: number) => void
  updateSet: (exerciseIndex: number, setIndex: number, reps: number, weight: number) => void
  deleteSet: (exerciseIndex: number, setIndex: number) => void
  startRest: (seconds: number) => void
  skipRest: () => void
  decrementRestTimer: () => void
  addSet: (exerciseIndex: number) => void
  addExercise: (exercise: Omit<ActiveExercise, "sets">) => void
  removeExercise: (exerciseIndex: number) => void
  nextExercise: () => void
  setCurrentExercise: (index: number) => void
  reset: () => void
}

export const useActiveWorkoutStore = create<ActiveWorkoutState>((set) => ({
  isActive: false,
  startTime: null,
  title: "",
  exercises: [],
  currentExerciseIndex: 0,
  currentSetIndex: 0,
  restTimer: 0,
  isResting: false,

  startWorkout: (title, exercises) =>
    set({
      isActive: true,
      startTime: new Date(),
      title,
      exercises: exercises.map((ex) => ({
        ...ex,
        sets: Array.from({ length: ex.targetSets }, () => ({
          reps: 0,
          weight: 0,
          completed: false,
        })),
      })),
      currentExerciseIndex: 0,
      currentSetIndex: 0,
    }),

  endWorkout: () =>
    set({
      isActive: false,
      startTime: null,
      title: "",
      exercises: [],
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      restTimer: 0,
      isResting: false,
    }),

  completeSet: (exerciseIndex, setIndex, reps, weight) =>
    set((state) => {
      const exercises = [...state.exercises]
      exercises[exerciseIndex].sets[setIndex] = { reps, weight, completed: true }
      return { exercises }
    }),

  updateSet: (exerciseIndex, setIndex, reps, weight) =>
    set((state) => {
      const exercises = [...state.exercises]
      if (exercises[exerciseIndex]?.sets[setIndex]) {
        exercises[exerciseIndex].sets[setIndex] = { reps, weight, completed: true }
      }
      return { exercises }
    }),

  deleteSet: (exerciseIndex, setIndex) =>
    set((state) => {
      const exercises = [...state.exercises]
      if (exercises[exerciseIndex]) {
        exercises[exerciseIndex].sets = exercises[exerciseIndex].sets.filter((_, i) => i !== setIndex)
        exercises[exerciseIndex].targetSets = Math.max(1, exercises[exerciseIndex].targetSets - 1)
      }
      return { exercises }
    }),

  startRest: (seconds) => set({ restTimer: seconds, isResting: true }),

  skipRest: () => set({ restTimer: 0, isResting: false }),

  decrementRestTimer: () =>
    set((state) => {
      if (state.restTimer <= 1) {
        return { restTimer: 0, isResting: false }
      }
      return { restTimer: state.restTimer - 1 }
    }),

  addSet: (exerciseIndex) =>
    set((state) => {
      const exercises = [...state.exercises]
      exercises[exerciseIndex].sets.push({ reps: 0, weight: 0, completed: false })
      exercises[exerciseIndex].targetSets++
      return { exercises }
    }),

  addExercise: (exercise) =>
    set((state) => ({
      exercises: [
        ...state.exercises,
        {
          ...exercise,
          sets: Array.from({ length: exercise.targetSets }, () => ({
            reps: 0,
            weight: 0,
            completed: false,
          })),
        },
      ],
    })),

  removeExercise: (exerciseIndex) =>
    set((state) => {
      const exercises = state.exercises.filter((_, i) => i !== exerciseIndex)
      const newCurrentIndex = state.currentExerciseIndex >= exercises.length
        ? Math.max(0, exercises.length - 1)
        : state.currentExerciseIndex
      return { exercises, currentExerciseIndex: newCurrentIndex }
    }),

  nextExercise: () =>
    set((state) => ({
      currentExerciseIndex: Math.min(
        state.currentExerciseIndex + 1,
        state.exercises.length - 1
      ),
      currentSetIndex: 0,
    })),

  setCurrentExercise: (index) =>
    set({ currentExerciseIndex: index, currentSetIndex: 0 }),

  reset: () =>
    set({
      isActive: false,
      startTime: null,
      title: "",
      exercises: [],
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      restTimer: 0,
      isResting: false,
    }),
}))

// ============================================
// Nutrition Goals Store (Local Cache)
// ============================================

interface NutritionGoalsState {
  calories: number
  protein: number
  carbs: number
  fats: number
  water: number
  setGoals: (goals: Partial<NutritionGoalsState>) => void
}

export const useNutritionGoalsStore = create<NutritionGoalsState>((set) => ({
  calories: 1900,
  protein: 110,
  carbs: 230,
  fats: 60,
  water: 4000,
  setGoals: (goals) => set(goals),
}))

// ============================================
// Helper: Format date for API
// ============================================

export const formatDateForApi = (date: Date): string => {
  return format(date, "yyyy-MM-dd")
}
