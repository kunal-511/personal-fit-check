"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Calendar,
  Clock,
  Dumbbell,
  ChevronDown,
  ChevronUp,
  Flame,
  Target,
  MoreHorizontal,
  Copy,
  Trash2,
  Edit,
  Share2,
} from "lucide-react"
import { GlassCard } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { cn, formatDate } from "@/lib/utils"
import { workoutsApi } from "@/lib/api"
import type { Workout, Exercise } from "@/types"

const muscleGroupColors: Record<string, string> = {
  Chest: "bg-red-500/10 text-red-500",
  Back: "bg-blue-500/10 text-blue-500",
  Shoulders: "bg-orange-500/10 text-orange-500",
  Biceps: "bg-purple-500/10 text-purple-500",
  Triceps: "bg-pink-500/10 text-pink-500",
  Legs: "bg-green-500/10 text-green-500",
  Glutes: "bg-emerald-500/10 text-emerald-500",
  Core: "bg-amber-500/10 text-amber-500",
}

export default function WorkoutHistoryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [workout, setWorkout] = useState<Workout | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedExercises, setExpandedExercises] = useState<Set<number>>(new Set())

  useEffect(() => {
    async function fetchWorkout() {
      try {
        const res = await workoutsApi.getById(id)
        if (res.workout) {
          setWorkout(res.workout)
          // Expand all exercises by default
          if (res.workout.exercises) {
            setExpandedExercises(new Set(res.workout.exercises.map((e: Exercise) => e.id)))
          }
        }
      } catch (error) {
        console.error("Failed to fetch workout:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchWorkout()
  }, [id])

  const toggleExercise = (exerciseId: number) => {
    setExpandedExercises((prev) => {
      const next = new Set(prev)
      if (next.has(exerciseId)) {
        next.delete(exerciseId)
      } else {
        next.add(exerciseId)
      }
      return next
    })
  }

  const formatFullDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const calculateTotalStats = () => {
    if (!workout?.exercises) return { totalSets: 0, totalReps: 0 }

    let totalSets = 0
    let totalReps = 0

    workout.exercises.forEach((ex) => {
      if (ex.sets) {
        totalSets += ex.sets.length
        ex.sets.forEach((set) => {
          totalReps += set.reps || 0
        })
      }
    })

    return { totalSets, totalReps }
  }

  const getMuscleGroups = () => {
    if (!workout?.exercises) return []
    const groups = new Set(workout.exercises.map((e) => e.muscle_group).filter(Boolean))
    return Array.from(groups) as string[]
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (!workout) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center">
          <Dumbbell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">Workout not found</p>
          <Link href="/workouts">
            <Button variant="outline" className="mt-4">
              Back to Workouts
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const { totalSets, totalReps } = calculateTotalStats()
  const muscleGroups = getMuscleGroups()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/workouts">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{workout.title}</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {formatFullDate(workout.date)}
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Copy className="h-4 w-4 mr-2" />
              Repeat Workout
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Edit className="h-4 w-4 mr-2" />
              Edit Workout
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Clock className="h-4 w-4" />
            <span className="text-xs">Duration</span>
          </div>
          <p className="text-xl font-bold">{workout.duration_minutes || 0} min</p>
          <p className="text-xs text-muted-foreground capitalize">{workout.workout_type}</p>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Dumbbell className="h-4 w-4" />
            <span className="text-xs">Volume</span>
          </div>
          <p className="text-xl font-bold">NA</p>
          <p className="text-xs text-muted-foreground">
            {totalSets} sets {totalReps} reps
          </p>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Flame className="h-4 w-4" />
            <span className="text-xs">Calories</span>
          </div>
          <p className="text-xl font-bold">NA</p>
          <p className="text-xs text-muted-foreground">kcal burned</p>
        </GlassCard>

        <GlassCard className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Target className="h-4 w-4" />
            <span className="text-xs">Exercises</span>
          </div>
          <p className="text-xl font-bold">{workout.exercises?.length || 0}</p>
          <p className="text-xs text-muted-foreground">completed</p>
        </GlassCard>
      </div>

      {/* Muscle Groups */}
      {muscleGroups.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {muscleGroups.map((muscle) => (
            <span
              key={muscle}
              className={cn(
                "px-3 py-1 rounded-full text-sm font-medium",
                muscleGroupColors[muscle] || "bg-secondary"
              )}
            >
              {muscle}
            </span>
          ))}
        </div>
      )}

      {/* Workout Notes */}
      {workout.notes && (
        <GlassCard className="p-4">
          <p className="text-sm text-muted-foreground mb-1">Notes</p>
          <p>{workout.notes}</p>
        </GlassCard>
      )}

      {/* Exercises */}
      {workout.exercises && workout.exercises.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <Target className="h-5 w-5" />
            Exercises ({workout.exercises.length})
          </h2>

          {workout.exercises.map((exercise, index) => {
            const isExpanded = expandedExercises.has(exercise.id)

            return (
              <GlassCard key={exercise.id} className="overflow-hidden">
                {/* Exercise Header */}
                <button
                  className="w-full p-4 flex items-center justify-between text-left"
                  onClick={() => toggleExercise(exercise.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{exercise.exercise_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {exercise.sets?.length || exercise.sets_completed || 0} sets
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {exercise.muscle_group && (
                      <span className="text-xs text-muted-foreground">{exercise.muscle_group}</span>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Exercise Details */}
                {isExpanded && exercise.sets && exercise.sets.length > 0 && (
                  <div className="px-4 pb-4 space-y-3">
                    {/* Sets Table */}
                    <div className="bg-secondary/30 rounded-lg overflow-hidden">
                      <div className="grid grid-cols-4 gap-2 p-2 text-xs text-muted-foreground font-medium border-b border-border/50">
                        <span>Set</span>
                        <span>Weight</span>
                        <span>Reps</span>
                        <span>RPE</span>
                      </div>
                      {exercise.sets.map((set) => (
                        <div
                          key={set.set_number}
                          className="grid grid-cols-4 gap-2 p-2 text-sm"
                        >
                          <span className="font-medium">{set.set_number}</span>
                          <span>{set.weight_kg} kg</span>
                          <span>{set.reps}</span>
                          <span className="text-muted-foreground">
                            {set.rpe ? `${set.rpe}/10` : "-"}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Exercise Notes */}
                    {exercise.notes && (
                      <p className="text-sm text-muted-foreground italic p-2 bg-secondary/20 rounded-lg">
                        &ldquo;{exercise.notes}&rdquo;
                      </p>
                    )}
                  </div>
                )}
              </GlassCard>
            )
          })}
        </div>
      )}

      {/* Empty State for Exercises */}
      {(!workout.exercises || workout.exercises.length === 0) && (
        <GlassCard className="p-8">
          <div className="flex flex-col items-center justify-center">
            <Dumbbell className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">No exercise details recorded</p>
          </div>
        </GlassCard>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="outline"
          className="h-12"
          onClick={() => router.push("/workouts/new")}
        >
          <Copy className="h-4 w-4 mr-2" />
          Repeat Workout
        </Button>
        <Button
          className="h-12"
          onClick={() => router.push("/workouts")}
        >
          <Dumbbell className="h-4 w-4 mr-2" />
          View All Workouts
        </Button>
      </div>
    </div>
  )
}
