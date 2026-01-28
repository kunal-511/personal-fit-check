"use client"

import { useState, useEffect, useMemo, Suspense } from "react"
import { ArrowLeft, Check, Plus, Trophy, History, Loader2, X, Trash2, Pencil } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { GlassCard } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { RestTimer, WorkoutSummary, ExerciseHistory, ExerciseLibrary } from "@/components/workouts"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { workoutsApi } from "@/lib/api"
import { useActiveWorkoutStore } from "@/lib/store"

// Template workout data
const workoutTemplates: Record<string, { title: string; exercises: Array<{ name: string; targetSets: number; lastWeight: number; lastReps: number[]; muscleGroup: string }> }> = {
  push: {
    title: "Push Day",
    exercises: [
      { name: "Bench Press", targetSets: 4, lastWeight: 80, lastReps: [10, 8, 7, 6], muscleGroup: "Chest" },
      { name: "Incline Dumbbell Press", targetSets: 3, lastWeight: 30, lastReps: [12, 10, 10], muscleGroup: "Chest" },
      { name: "Cable Flyes", targetSets: 3, lastWeight: 15, lastReps: [15, 12, 12], muscleGroup: "Chest" },
      { name: "Overhead Press", targetSets: 3, lastWeight: 45, lastReps: [10, 8, 8], muscleGroup: "Shoulders" },
      { name: "Lateral Raises", targetSets: 3, lastWeight: 10, lastReps: [15, 12, 12], muscleGroup: "Shoulders" },
    ],
  },
  pull: {
    title: "Pull Day",
    exercises: [
      { name: "Pull-ups", targetSets: 4, lastWeight: 0, lastReps: [12, 10, 8, 8], muscleGroup: "Back" },
      { name: "Barbell Row", targetSets: 4, lastWeight: 70, lastReps: [10, 10, 8, 8], muscleGroup: "Back" },
      { name: "Lat Pulldown", targetSets: 3, lastWeight: 60, lastReps: [12, 10, 10], muscleGroup: "Back" },
      { name: "Face Pulls", targetSets: 3, lastWeight: 20, lastReps: [15, 15, 12], muscleGroup: "Shoulders" },
      { name: "Barbell Curl", targetSets: 3, lastWeight: 30, lastReps: [12, 10, 10], muscleGroup: "Biceps" },
      { name: "Hammer Curl", targetSets: 3, lastWeight: 14, lastReps: [12, 10, 10], muscleGroup: "Biceps" },
    ],
  },
  legs: {
    title: "Leg Day",
    exercises: [
      { name: "Squat", targetSets: 4, lastWeight: 100, lastReps: [8, 8, 6, 6], muscleGroup: "Legs" },
      { name: "Romanian Deadlift", targetSets: 3, lastWeight: 80, lastReps: [10, 10, 8], muscleGroup: "Legs" },
      { name: "Leg Press", targetSets: 3, lastWeight: 150, lastReps: [12, 10, 10], muscleGroup: "Legs" },
      { name: "Leg Curl", targetSets: 3, lastWeight: 40, lastReps: [12, 12, 10], muscleGroup: "Legs" },
      { name: "Leg Extension", targetSets: 3, lastWeight: 50, lastReps: [12, 12, 10], muscleGroup: "Legs" },
      { name: "Calf Raises", targetSets: 4, lastWeight: 80, lastReps: [15, 15, 12, 12], muscleGroup: "Legs" },
    ],
  },
}

interface CompletedSet {
  reps: number
  weight: number
  rpe?: number
}

function ActiveWorkoutContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const template = searchParams.get("template")

  // Store state
  const {
    isActive,
    title: storeTitle,
    exercises: storeExercises,
    startWorkout: startWorkoutStore,
    addExercise: addExerciseToStore,
    removeExercise: removeExerciseFromStore,
    reset: resetStore,
  } = useActiveWorkoutStore()

  // Local state for the workout session
  const [workoutTitle, setWorkoutTitle] = useState("")
  const [exercises, setExercises] = useState<Array<{
    name: string
    targetSets: number
    lastWeight: number
    lastReps: number[]
    muscleGroup: string
  }>>([])
  const [currentExercise, setCurrentExercise] = useState(0)
  const [currentSet, setCurrentSet] = useState(0)
  const [completedSets, setCompletedSets] = useState<CompletedSet[][]>([])
  const [showRestTimer, setShowRestTimer] = useState(false)
  const [workoutTime, setWorkoutTime] = useState(0)
  const [weight, setWeight] = useState("")
  const [reps, setReps] = useState("")
  const [showSummary, setShowSummary] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showAddExercise, setShowAddExercise] = useState(false)
  const [personalRecords, setPersonalRecords] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [editingSet, setEditingSet] = useState<{ exerciseIndex: number; setIndex: number } | null>(null)
  const [editWeight, setEditWeight] = useState("")
  const [editReps, setEditReps] = useState("")

  // Initialize workout based on template or store
  useEffect(() => {
    if (initialized) return

    if (template && workoutTemplates[template]) {
      // Load from template
      const templateData = workoutTemplates[template]
      setWorkoutTitle(templateData.title)
      setExercises(templateData.exercises)
      setCompletedSets(templateData.exercises.map(() => []))
      if (templateData.exercises.length > 0) {
        setWeight(templateData.exercises[0].lastWeight.toString())
      }
    } else if (isActive && storeExercises.length > 0) {
      // Load from store (custom workout)
      setWorkoutTitle(storeTitle)
      setExercises(storeExercises.map((ex) => ({
        name: ex.name,
        targetSets: ex.targetSets,
        lastWeight: 0,
        lastReps: Array(ex.targetSets).fill(10),
        muscleGroup: ex.muscleGroup,
      })))
      setCompletedSets(storeExercises.map(() => []))
      setWeight("0")
    } else if (isActive) {
      // Empty workout from store
      setWorkoutTitle(storeTitle || "Custom Workout")
      setExercises([])
      setCompletedSets([])
    } else {
      // No workout started - allow starting empty
      setWorkoutTitle("Custom Workout")
      setExercises([])
      setCompletedSets([])
    }

    setInitialized(true)
  }, [template, isActive, storeTitle, storeExercises, initialized])

  // Workout timer
  useEffect(() => {
    const interval = setInterval(() => {
      setWorkoutTime((t) => t + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const exercise = exercises[currentExercise]
  const totalSets = exercises.reduce((acc, ex) => acc + ex.targetSets, 0)
  const completedSetsCount = completedSets.reduce((acc, sets) => acc + sets.length, 0)
  const progress = totalSets > 0 ? (completedSetsCount / totalSets) * 100 : 0

  // Add new exercise during workout
  const handleAddExercise = (exerciseData: { id: string; name: string; muscleGroup: string }) => {
    const newExercise = {
      name: exerciseData.name,
      targetSets: 3,
      lastWeight: 0,
      lastReps: [10, 10, 10],
      muscleGroup: exerciseData.muscleGroup,
    }
    setExercises([...exercises, newExercise])
    setCompletedSets([...completedSets, []])

    // Also add to store if active
    if (isActive) {
      addExerciseToStore({
        name: exerciseData.name,
        muscleGroup: exerciseData.muscleGroup,
        targetSets: 3,
      })
    }

    setShowAddExercise(false)

    // If this is the first exercise, set it as current
    if (exercises.length === 0) {
      setCurrentExercise(0)
      setWeight("0")
    }
  }

  const handleRemoveExercise = (index: number) => {
    const newExercises = exercises.filter((_, i) => i !== index)
    const newCompletedSets = completedSets.filter((_, i) => i !== index)
    setExercises(newExercises)
    setCompletedSets(newCompletedSets)

    // Adjust current exercise index
    if (currentExercise >= newExercises.length && newExercises.length > 0) {
      setCurrentExercise(newExercises.length - 1)
      setWeight(newExercises[newExercises.length - 1].lastWeight.toString())
    } else if (newExercises.length === 0) {
      setCurrentExercise(0)
      setWeight("")
    }
  }

  // Check for PR
  const checkForPR = (exerciseName: string, newWeight: number, newReps: number) => {
    const prThresholds: Record<string, { weight: number; reps: number }> = {
      "Bench Press": { weight: 80, reps: 8 },
      "Squat": { weight: 100, reps: 6 },
      "Deadlift": { weight: 110, reps: 5 },
    }

    const threshold = prThresholds[exerciseName]
    if (threshold && newWeight >= threshold.weight && newReps >= threshold.reps) {
      if (newWeight > threshold.weight || (newWeight === threshold.weight && newReps > threshold.reps)) {
        return true
      }
    }
    return false
  }

  const handleFinishSet = () => {
    if (!reps || !exercise) return

    const newWeight = parseFloat(weight) || 0
    const newReps = parseInt(reps)

    // Check for PR
    const isPR = checkForPR(exercise.name, newWeight, newReps)
    if (isPR) {
      setPersonalRecords([...personalRecords, exercise.name])
    }

    const newCompletedSets = [...completedSets]
    newCompletedSets[currentExercise] = [
      ...newCompletedSets[currentExercise],
      { reps: newReps, weight: newWeight },
    ]
    setCompletedSets(newCompletedSets)

    // Show rest timer
    setShowRestTimer(true)

    // Move to next set or exercise
    if (currentSet + 1 >= exercise.targetSets) {
      if (currentExercise + 1 < exercises.length) {
        setCurrentExercise(currentExercise + 1)
        setCurrentSet(0)
        setWeight(exercises[currentExercise + 1].lastWeight.toString())
      }
    } else {
      setCurrentSet(currentSet + 1)
    }
    setReps("")
  }

  const handleRestComplete = () => {
    setShowRestTimer(false)
  }

  const handleSkipRest = () => {
    setShowRestTimer(false)
  }

  const handleEditSet = (exerciseIndex: number, setIndex: number) => {
    const set = completedSets[exerciseIndex]?.[setIndex]
    if (set) {
      setEditWeight(set.weight.toString())
      setEditReps(set.reps.toString())
      setEditingSet({ exerciseIndex, setIndex })
    }
  }

  const handleSaveEdit = () => {
    if (!editingSet || !editReps) return

    const { exerciseIndex, setIndex } = editingSet
    const newWeight = parseFloat(editWeight) || 0
    const newReps = parseInt(editReps)

    const newCompletedSets = [...completedSets]
    newCompletedSets[exerciseIndex][setIndex] = {
      ...newCompletedSets[exerciseIndex][setIndex],
      reps: newReps,
      weight: newWeight,
    }
    setCompletedSets(newCompletedSets)
    setEditingSet(null)
    setEditWeight("")
    setEditReps("")
  }

  const handleDeleteSet = (exerciseIndex: number, setIndex: number) => {
    const newCompletedSets = [...completedSets]
    newCompletedSets[exerciseIndex] = newCompletedSets[exerciseIndex].filter((_, i) => i !== setIndex)
    setCompletedSets(newCompletedSets)

    // Adjust current set index if needed
    if (exerciseIndex === currentExercise && currentSet > 0 && currentSet >= newCompletedSets[exerciseIndex].length) {
      setCurrentSet(newCompletedSets[exerciseIndex].length)
    }
  }

  const handleAddSetToExercise = (exerciseIndex: number) => {
    const newExercises = [...exercises]
    newExercises[exerciseIndex] = {
      ...newExercises[exerciseIndex],
      targetSets: newExercises[exerciseIndex].targetSets + 1,
      lastReps: [...newExercises[exerciseIndex].lastReps, 10],
    }
    setExercises(newExercises)
  }

  const handleFinishWorkout = async () => {
    // Don't save if no sets completed
    if (completedSetsCount === 0) {
      resetStore()
      router.push("/workouts")
      return
    }

    setSaving(true)
    try {
      // Build workout data for API
      const workoutData = {
        workout_type: "strength" as const,
        title: workoutTitle,
        duration_minutes: Math.round(workoutTime / 60),
        notes: personalRecords.length > 0 ? `PRs achieved: ${personalRecords.join(", ")}` : undefined,
        exercises: exercises
          .map((ex, idx) => ({
            exercise_name: ex.name,
            muscle_group: ex.muscleGroup,
            target_sets: ex.targetSets,
            sets: completedSets[idx].map((set) => ({
              reps: set.reps,
              weight_kg: set.weight,
              rpe: set.rpe,
            })),
          }))
          .filter((ex) => ex.sets.length > 0),
      }

      await workoutsApi.create(workoutData)
    } catch (error) {
      console.error("Failed to save workout:", error)
    } finally {
      setSaving(false)
      resetStore()
      setShowSummary(true)
    }
  }

  const handleSummaryClose = () => {
    router.push("/workouts")
  }

  const selectExercise = (index: number) => {
    setCurrentExercise(index)
    setCurrentSet(completedSets[index]?.length || 0)
    setWeight(exercises[index].lastWeight.toString())
    setReps("")
  }

  if (saving) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-lg font-medium">Saving workout...</p>
        <p className="text-sm text-muted-foreground">Recording your progress</p>
      </div>
    )
  }

  if (showSummary) {
    const summaryData = {
      title: workoutTitle,
      date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
      duration: Math.round(workoutTime / 60),
      totalVolume: 0, // Not calculated - shown as NA in UI
      totalSets: completedSetsCount,
      exercises: exercises.map((ex, idx) => ({
        name: ex.name,
        sets: completedSets[idx]?.length || 0,
        bestSet: (completedSets[idx] || []).reduce(
          (best, set) => (set.weight > best.weight ? set : best),
          { weight: 0, reps: 0 }
        ),
        totalVolume: 0, // Not calculated - shown as NA in UI
        isPR: personalRecords.includes(ex.name),
      })),
      caloriesBurned: 0, // Not calculated - shown as NA in UI
      prsAchieved: personalRecords.length,
      muscleGroups: [...new Set(exercises.map((ex) => ex.muscleGroup))],
    }

    return (
      <div className="space-y-6">
        <WorkoutSummary data={summaryData} onClose={handleSummaryClose} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/workouts">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">{workoutTitle}</h1>
            <p className="text-sm text-muted-foreground">
              {exercises.length > 0
                ? `Exercise ${currentExercise + 1} of ${exercises.length}`
                : "No exercises added yet"}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-mono font-bold">{formatTime(workoutTime)}</p>
          <p className="text-xs text-muted-foreground">Duration</p>
        </div>
      </div>

      {/* Progress */}
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground">Progress</span>
          <span>{completedSetsCount}/{totalSets} sets</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Rest Timer Modal */}
      {showRestTimer && (
        <RestTimer
          initialSeconds={90}
          onComplete={handleRestComplete}
          onSkip={handleSkipRest}
          autoStart={true}
        />
      )}

      {/* Current Exercise or Empty State */}
      {!showRestTimer && exercises.length > 0 && exercise && (
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">{exercise.name}</h2>
              <p className="text-muted-foreground">
                {exercise.lastWeight > 0
                  ? `Last: ${exercise.lastWeight}kg × ${exercise.lastReps.join(", ")}`
                  : exercise.muscleGroup}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowHistory(true)}
            >
              <History className="h-5 w-5" />
            </Button>
          </div>

          {/* Sets Progress */}
          <div className="mb-6 flex gap-2">
            {Array.from({ length: exercise.targetSets }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "flex-1 h-2 rounded-full transition-all",
                  i < (completedSets[currentExercise]?.length || 0)
                    ? "bg-primary"
                    : i === currentSet
                    ? "bg-primary/50"
                    : "bg-secondary"
                )}
              />
            ))}
          </div>

          {/* Completed Sets Display */}
          {completedSets[currentExercise]?.length > 0 && (
            <div className="mb-4 p-3 rounded-lg bg-secondary/30">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">Completed Sets</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {completedSets[currentExercise].map((set, idx) => (
                  <div
                    key={idx}
                    className="group relative flex items-center gap-1 px-2 py-1 text-sm rounded bg-primary/20 text-primary"
                  >
                    <span>Set {idx + 1}: {set.weight}kg × {set.reps}</span>
                    <div className="flex items-center gap-0.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEditSet(currentExercise, idx)
                        }}
                        className="p-0.5 hover:bg-primary/30 rounded"
                        title="Edit set"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteSet(currentExercise, idx)
                        }}
                        className="p-0.5 hover:bg-destructive/30 text-destructive rounded"
                        title="Delete set"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Current Set */}
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-1">
              <p className="text-sm text-muted-foreground">
                Set {currentSet + 1} of {exercise.targetSets}
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => handleAddSetToExercise(currentExercise)}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Set
              </Button>
            </div>
            <p className="text-lg">
              Target: <span className="font-bold">{exercise.lastReps[currentSet] || 10} reps</span>
            </p>
          </div>

          {/* Input */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Weight (kg)
              </label>
              <Input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="text-center text-2xl h-14"
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Reps
              </label>
              <Input
                type="number"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                placeholder={exercise.lastReps[currentSet]?.toString() || "10"}
                className="text-center text-2xl h-14"
              />
            </div>
          </div>

          {/* PR Alert */}
          {personalRecords.includes(exercise.name) && (
            <div className="mb-4 p-3 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center gap-3">
              <Trophy className="h-5 w-5 text-amber-500" />
              <span className="text-amber-500 font-medium">New Personal Record!</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              className="flex-1 h-14 text-lg"
              onClick={handleFinishSet}
              disabled={!reps}
            >
              <Check className="mr-2 h-5 w-5" />
              Finish Set
            </Button>
          </div>
        </GlassCard>
      )}

      {/* Empty State - No exercises */}
      {!showRestTimer && exercises.length === 0 && (
        <GlassCard className="p-8">
          <div className="text-center">
            <p className="text-lg font-medium mb-2">No exercises added yet</p>
            <p className="text-muted-foreground mb-4">
              Add exercises to start tracking your workout
            </p>
            <Button onClick={() => setShowAddExercise(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add First Exercise
            </Button>
          </div>
        </GlassCard>
      )}

      {/* Exercise List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Exercises</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddExercise(true)}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add
          </Button>
        </div>
        <div className="space-y-2">
          {exercises.map((ex, i) => {
            const isComplete = (completedSets[i]?.length || 0) >= ex.targetSets
            const isCurrent = i === currentExercise
            const hasPR = personalRecords.includes(ex.name)

            return (
              <GlassCard
                key={i}
                className={cn(
                  "p-3 transition-all cursor-pointer hover:bg-white/[0.05]",
                  isCurrent && "ring-2 ring-primary"
                )}
                onClick={() => selectExercise(i)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                        isComplete
                          ? "bg-primary text-primary-foreground"
                          : isCurrent
                          ? "bg-primary/20 text-primary"
                          : "bg-secondary text-muted-foreground"
                      )}
                    >
                      {isComplete ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        i + 1
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={cn(i < currentExercise && "text-muted-foreground")}>
                          {ex.name}
                        </span>
                        {hasPR && <Trophy className="h-3 w-3 text-amber-500" />}
                      </div>
                      <span className="text-xs text-muted-foreground">{ex.muscleGroup}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-muted-foreground mr-1">
                      {completedSets[i]?.length || 0}/{ex.targetSets}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleAddSetToExercise(i)
                      }}
                      title="Add set"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveExercise(i)
                      }}
                      title="Remove exercise"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </GlassCard>
            )
          })}
        </div>
      </div>

      {/* Finish Workout */}
      <Button
        variant="outline"
        className="w-full"
        size="lg"
        onClick={handleFinishWorkout}
        disabled={saving}
      >
        {saving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Finish Workout"
        )}
      </Button>

      {/* Add Exercise Dialog */}
      <Dialog open={showAddExercise} onOpenChange={setShowAddExercise}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Exercise</DialogTitle>
          </DialogHeader>
          <ExerciseLibrary
            onSelectExercise={handleAddExercise}
            selectedExercises={exercises.map((e, i) => `${e.name}-${i}`)}
            className="border-0 shadow-none p-0"
          />
        </DialogContent>
      </Dialog>

      {/* Exercise History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Exercise History</DialogTitle>
          </DialogHeader>
          {exercise && (
            <ExerciseHistory
              data={{
                exerciseName: exercise.name,
                muscleGroup: exercise.muscleGroup,
                sessions: [
                  {
                    id: "1",
                    date: "Jan 14, 2026",
                    workoutTitle: "Push Day",
                    sets: [
                      { setNumber: 1, weight: 80, reps: 9, rpe: 8 },
                      { setNumber: 2, weight: 80, reps: 8, rpe: 8 },
                      { setNumber: 3, weight: 77.5, reps: 9, rpe: 8.5 },
                    ],
                    totalVolume: 2092,
                    maxWeight: 80,
                  },
                ],
                personalRecord: { weight: 80, reps: 9, date: "Jan 14, 2026" },
                totalSessions: 12,
              }}
              className="border-0 shadow-none p-0"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Set Dialog */}
      <Dialog open={editingSet !== null} onOpenChange={(open) => !open && setEditingSet(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Set {editingSet ? editingSet.setIndex + 1 : ""}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Weight (kg)
              </label>
              <Input
                type="number"
                value={editWeight}
                onChange={(e) => setEditWeight(e.target.value)}
                className="text-center text-xl h-12"
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Reps
              </label>
              <Input
                type="number"
                value={editReps}
                onChange={(e) => setEditReps(e.target.value)}
                className="text-center text-xl h-12"
                placeholder="10"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setEditingSet(null)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSaveEdit} disabled={!editReps}>
              <Check className="mr-2 h-4 w-4" />
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <Skeleton className="h-2 w-full" />
      <Skeleton className="h-64 w-full rounded-xl" />
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    </div>
  )
}

export default function ActiveWorkoutPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ActiveWorkoutContent />
    </Suspense>
  )
}
