"use client"

import { useState, useMemo } from "react"
import { Search, Plus, Dumbbell, ChevronRight, Star, History, X, Sparkles } from "lucide-react"
import { GlassCard } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type MuscleGroup = "chest" | "back" | "shoulders" | "biceps" | "triceps" | "legs" | "core" | "cardio"

const CUSTOM_EXERCISES_KEY = "fitness-tracker-custom-exercises"

interface Exercise {
  id: string
  name: string
  muscleGroup: MuscleGroup
  secondaryMuscles?: MuscleGroup[]
  equipment: string
  difficulty: "beginner" | "intermediate" | "advanced"
  isFavorite?: boolean
  lastUsed?: string
  personalRecord?: {
    weight: number
    reps: number
  }
}

interface ExerciseLibraryProps {
  onSelectExercise?: (exercise: Exercise) => void
  selectedExercises?: string[]
  className?: string
}

const exerciseDatabase: Exercise[] = [
  // Chest
  { id: "1", name: "Bench Press", muscleGroup: "chest", secondaryMuscles: ["triceps", "shoulders"], equipment: "Barbell", difficulty: "intermediate", isFavorite: true, personalRecord: { weight: 82.5, reps: 8 } },
  { id: "2", name: "Incline Dumbbell Press", muscleGroup: "chest", secondaryMuscles: ["shoulders"], equipment: "Dumbbells", difficulty: "intermediate", personalRecord: { weight: 32, reps: 10 } },
  { id: "3", name: "Cable Flyes", muscleGroup: "chest", equipment: "Cable Machine", difficulty: "beginner" },
  { id: "4", name: "Push-ups", muscleGroup: "chest", secondaryMuscles: ["triceps", "core"], equipment: "Bodyweight", difficulty: "beginner" },
  { id: "5", name: "Dumbbell Flyes", muscleGroup: "chest", equipment: "Dumbbells", difficulty: "beginner" },
  { id: "6", name: "Decline Bench Press", muscleGroup: "chest", secondaryMuscles: ["triceps"], equipment: "Barbell", difficulty: "intermediate" },
  { id: "7", name: "Chest Dips", muscleGroup: "chest", secondaryMuscles: ["triceps"], equipment: "Dip Station", difficulty: "intermediate", isFavorite: true },

  // Back
  { id: "8", name: "Pull-ups", muscleGroup: "back", secondaryMuscles: ["biceps"], equipment: "Pull-up Bar", difficulty: "intermediate", isFavorite: true, personalRecord: { weight: 0, reps: 12 } },
  { id: "9", name: "Lat Pulldown", muscleGroup: "back", secondaryMuscles: ["biceps"], equipment: "Cable Machine", difficulty: "beginner" },
  { id: "10", name: "Barbell Row", muscleGroup: "back", secondaryMuscles: ["biceps"], equipment: "Barbell", difficulty: "intermediate", personalRecord: { weight: 70, reps: 10 } },
  { id: "11", name: "Seated Cable Row", muscleGroup: "back", equipment: "Cable Machine", difficulty: "beginner" },
  { id: "12", name: "Deadlift", muscleGroup: "back", secondaryMuscles: ["legs", "core"], equipment: "Barbell", difficulty: "advanced", isFavorite: true, personalRecord: { weight: 112.5, reps: 5 } },
  { id: "13", name: "T-Bar Row", muscleGroup: "back", equipment: "T-Bar", difficulty: "intermediate" },

  // Shoulders
  { id: "14", name: "Overhead Press", muscleGroup: "shoulders", secondaryMuscles: ["triceps"], equipment: "Barbell", difficulty: "intermediate", personalRecord: { weight: 50, reps: 8 } },
  { id: "15", name: "Lateral Raises", muscleGroup: "shoulders", equipment: "Dumbbells", difficulty: "beginner" },
  { id: "16", name: "Front Raises", muscleGroup: "shoulders", equipment: "Dumbbells", difficulty: "beginner" },
  { id: "17", name: "Face Pulls", muscleGroup: "shoulders", equipment: "Cable Machine", difficulty: "beginner", isFavorite: true },
  { id: "18", name: "Arnold Press", muscleGroup: "shoulders", equipment: "Dumbbells", difficulty: "intermediate" },

  // Biceps
  { id: "19", name: "Barbell Curl", muscleGroup: "biceps", equipment: "Barbell", difficulty: "beginner", personalRecord: { weight: 35, reps: 10 } },
  { id: "20", name: "Dumbbell Curl", muscleGroup: "biceps", equipment: "Dumbbells", difficulty: "beginner" },
  { id: "21", name: "Hammer Curl", muscleGroup: "biceps", equipment: "Dumbbells", difficulty: "beginner" },
  { id: "22", name: "Preacher Curl", muscleGroup: "biceps", equipment: "EZ Bar", difficulty: "beginner" },
  { id: "23", name: "Concentration Curl", muscleGroup: "biceps", equipment: "Dumbbell", difficulty: "beginner" },

  // Triceps
  { id: "24", name: "Tricep Pushdown", muscleGroup: "triceps", equipment: "Cable Machine", difficulty: "beginner" },
  { id: "25", name: "Skull Crushers", muscleGroup: "triceps", equipment: "EZ Bar", difficulty: "intermediate", personalRecord: { weight: 30, reps: 10 } },
  { id: "26", name: "Overhead Tricep Extension", muscleGroup: "triceps", equipment: "Dumbbell", difficulty: "beginner" },
  { id: "27", name: "Close Grip Bench Press", muscleGroup: "triceps", secondaryMuscles: ["chest"], equipment: "Barbell", difficulty: "intermediate" },
  { id: "28", name: "Tricep Dips", muscleGroup: "triceps", equipment: "Dip Station", difficulty: "intermediate" },

  // Legs
  { id: "29", name: "Squat", muscleGroup: "legs", secondaryMuscles: ["core"], equipment: "Barbell", difficulty: "intermediate", isFavorite: true, personalRecord: { weight: 100, reps: 7 } },
  { id: "30", name: "Leg Press", muscleGroup: "legs", equipment: "Leg Press Machine", difficulty: "beginner" },
  { id: "31", name: "Romanian Deadlift", muscleGroup: "legs", secondaryMuscles: ["back"], equipment: "Barbell", difficulty: "intermediate", personalRecord: { weight: 80, reps: 10 } },
  { id: "32", name: "Leg Curl", muscleGroup: "legs", equipment: "Machine", difficulty: "beginner" },
  { id: "33", name: "Leg Extension", muscleGroup: "legs", equipment: "Machine", difficulty: "beginner" },
  { id: "34", name: "Calf Raises", muscleGroup: "legs", equipment: "Machine", difficulty: "beginner" },
  { id: "35", name: "Lunges", muscleGroup: "legs", equipment: "Dumbbells", difficulty: "beginner" },
  { id: "36", name: "Bulgarian Split Squat", muscleGroup: "legs", equipment: "Dumbbells", difficulty: "intermediate" },

  // Core
  { id: "37", name: "Plank", muscleGroup: "core", equipment: "Bodyweight", difficulty: "beginner" },
  { id: "38", name: "Crunches", muscleGroup: "core", equipment: "Bodyweight", difficulty: "beginner" },
  { id: "39", name: "Hanging Leg Raises", muscleGroup: "core", equipment: "Pull-up Bar", difficulty: "intermediate", isFavorite: true },
  { id: "40", name: "Russian Twists", muscleGroup: "core", equipment: "Medicine Ball", difficulty: "beginner" },
  { id: "41", name: "Ab Wheel Rollout", muscleGroup: "core", equipment: "Ab Wheel", difficulty: "advanced" },
  { id: "42", name: "Cable Crunch", muscleGroup: "core", equipment: "Cable Machine", difficulty: "beginner" },
]

const muscleGroupLabels: Record<MuscleGroup, string> = {
  chest: "Chest",
  back: "Back",
  shoulders: "Shoulders",
  biceps: "Biceps",
  triceps: "Triceps",
  legs: "Legs",
  core: "Core",
  cardio: "Cardio",
}

const muscleGroupColors: Record<MuscleGroup, string> = {
  chest: "bg-red-500/10 text-red-500",
  back: "bg-blue-500/10 text-blue-500",
  shoulders: "bg-orange-500/10 text-orange-500",
  biceps: "bg-purple-500/10 text-purple-500",
  triceps: "bg-pink-500/10 text-pink-500",
  legs: "bg-green-500/10 text-green-500",
  core: "bg-amber-500/10 text-amber-500",
  cardio: "bg-cyan-500/10 text-cyan-500",
}

export function ExerciseLibrary({
  onSelectExercise,
  selectedExercises = [],
  className,
}: ExerciseLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | "all" | "favorites">("all")

  // Custom exercise state - initialize from localStorage
  const [customExercises, setCustomExercises] = useState<Exercise[]>(() => {
    if (typeof window === "undefined") return []
    const saved = localStorage.getItem(CUSTOM_EXERCISES_KEY)
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch {
        return []
      }
    }
    return []
  })
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [customName, setCustomName] = useState("")
  const [customMuscleGroup, setCustomMuscleGroup] = useState<MuscleGroup>("chest")

  // Save custom exercises to localStorage
  const saveCustomExercises = (exercises: Exercise[]) => {
    setCustomExercises(exercises)
    localStorage.setItem(CUSTOM_EXERCISES_KEY, JSON.stringify(exercises))
  }

  // Add a new custom exercise
  const handleAddCustomExercise = () => {
    if (!customName.trim()) return

    const newExercise: Exercise = {
      id: `custom-${Date.now()}`,
      name: customName.trim(),
      muscleGroup: customMuscleGroup,
      equipment: "Custom",
      difficulty: "intermediate",
    }

    saveCustomExercises([...customExercises, newExercise])
    setCustomName("")
    setShowCustomForm(false)
  }

  // Delete a custom exercise
  const handleDeleteCustomExercise = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    saveCustomExercises(customExercises.filter((ex) => ex.id !== id))
  }

  // Combine database and custom exercises
  const allExercises = useMemo(() => {
    return [...exerciseDatabase, ...customExercises]
  }, [customExercises])

  const filteredExercises = useMemo(() => {
    let exercises = allExercises

    // Filter by muscle group
    if (selectedMuscle === "favorites") {
      exercises = exercises.filter((e) => e.isFavorite)
    } else if (selectedMuscle !== "all") {
      exercises = exercises.filter(
        (e) => e.muscleGroup === selectedMuscle || e.secondaryMuscles?.includes(selectedMuscle)
      )
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      exercises = exercises.filter(
        (e) =>
          e.name.toLowerCase().includes(query) ||
          e.equipment.toLowerCase().includes(query) ||
          e.muscleGroup.toLowerCase().includes(query)
      )
    }

    // Sort: favorites first, then by name
    return exercises.sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1
      if (!a.isFavorite && b.isFavorite) return 1
      return a.name.localeCompare(b.name)
    })
  }, [searchQuery, selectedMuscle, allExercises])

  const muscleGroups: (MuscleGroup | "all" | "favorites")[] = [
    "all",
    "favorites",
    "chest",
    "back",
    "shoulders",
    "biceps",
    "triceps",
    "legs",
    "core",
  ]

  return (
    <GlassCard className={cn("p-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Dumbbell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">Exercise Library</h2>
            <p className="text-sm text-muted-foreground">
              {allExercises.length} exercises
              {customExercises.length > 0 && ` (${customExercises.length} custom)`}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCustomForm(!showCustomForm)}
          className="gap-1"
        >
          <Sparkles className="h-4 w-4" />
          Custom
        </Button>
      </div>

      {/* Custom Exercise Form */}
      {showCustomForm && (
        <div className="mb-4 p-4 rounded-lg bg-secondary/30 border border-border/50 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Add Custom Exercise
            </p>
            <button
              onClick={() => setShowCustomForm(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <Input
            placeholder="Exercise name..."
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddCustomExercise()}
          />
          <div className="flex flex-wrap gap-2">
            {(["chest", "back", "shoulders", "biceps", "triceps", "legs", "core"] as MuscleGroup[]).map(
              (muscle) => (
                <Button
                  key={muscle}
                  variant={customMuscleGroup === muscle ? "default" : "outline"}
                  size="sm"
                  className="text-xs"
                  onClick={() => setCustomMuscleGroup(muscle)}
                >
                  {muscleGroupLabels[muscle]}
                </Button>
              )
            )}
          </div>
          <Button
            className="w-full"
            size="sm"
            onClick={handleAddCustomExercise}
            disabled={!customName.trim()}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Exercise
          </Button>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search exercises..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Muscle Group Filter */}
      <div className="flex flex-wrap gap-2 mb-4">
        {muscleGroups.map((muscle) => (
          <Button
            key={muscle}
            variant={selectedMuscle === muscle ? "default" : "outline"}
            size="sm"
            className={cn(
              "text-xs",
              selectedMuscle === muscle && muscle === "favorites" && "bg-amber-500 hover:bg-amber-600"
            )}
            onClick={() => setSelectedMuscle(muscle)}
          >
            {muscle === "all" && "All"}
            {muscle === "favorites" && (
              <>
                <Star className="h-3 w-3 mr-1" />
                Favorites
              </>
            )}
            {muscle !== "all" && muscle !== "favorites" && muscleGroupLabels[muscle]}
          </Button>
        ))}
      </div>

      {/* Exercise List */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {filteredExercises.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Dumbbell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No exercises found</p>
          </div>
        ) : (
          filteredExercises.map((exercise) => {
            const isSelected = selectedExercises.includes(exercise.id)

            return (
              <div
                key={exercise.id}
                role="button"
                tabIndex={0}
                className={cn(
                  "w-full flex items-center justify-between p-3 rounded-lg transition-all cursor-pointer",
                  "hover:bg-secondary/50 text-left",
                  isSelected && "bg-primary/10 ring-1 ring-primary"
                )}
                onClick={() => onSelectExercise?.(exercise)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    onSelectExercise?.(exercise)
                  }
                }}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    muscleGroupColors[exercise.muscleGroup]
                  )}>
                    <Dumbbell className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{exercise.name}</p>
                      {exercise.isFavorite && (
                        <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                      )}
                      {exercise.id.startsWith("custom-") && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                          Custom
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className={cn(
                        "px-1.5 py-0.5 rounded",
                        muscleGroupColors[exercise.muscleGroup]
                      )}>
                        {muscleGroupLabels[exercise.muscleGroup]}
                      </span>
                      <span>•</span>
                      <span>{exercise.equipment}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {exercise.personalRecord && (
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <History className="h-3 w-3" />
                        PR
                      </p>
                      <p className="text-sm font-medium">
                        {exercise.personalRecord.weight}kg × {exercise.personalRecord.reps}
                      </p>
                    </div>
                  )}
                  {exercise.id.startsWith("custom-") && (
                    <button
                      onClick={(e) => handleDeleteCustomExercise(exercise.id, e)}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                      title="Delete custom exercise"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {isSelected ? (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Plus className="h-4 w-4 rotate-45" />
                    </div>
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Selected Count */}
      {selectedExercises.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {selectedExercises.length} exercise{selectedExercises.length > 1 ? "s" : ""} selected
          </p>
          <Button size="sm">
            Add to Workout
          </Button>
        </div>
      )}
    </GlassCard>
  )
}
