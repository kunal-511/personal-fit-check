"use client"

import { Trophy, Clock, Dumbbell, Flame, TrendingUp, Star, Share2, Check } from "lucide-react"
import { GlassCard } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ExerciseSummary {
  name: string
  sets: number
  bestSet: {
    weight: number
    reps: number
  }
  totalVolume: number
  isPR?: boolean
}

interface WorkoutSummaryData {
  title: string
  date: string
  duration: number // minutes
  totalVolume: number
  totalSets: number
  exercises: ExerciseSummary[]
  caloriesBurned: number
  prsAchieved: number
  muscleGroups: string[]
}

interface WorkoutSummaryProps {
  data?: WorkoutSummaryData
  onClose?: () => void
  onShare?: () => void
  className?: string
}

const mockSummaryData: WorkoutSummaryData = {
  title: "Push Day",
  date: "January 19, 2026",
  duration: 52,
  totalVolume: 8450,
  totalSets: 16,
  exercises: [
    {
      name: "Bench Press",
      sets: 4,
      bestSet: { weight: 82.5, reps: 8 },
      totalVolume: 2380,
      isPR: true,
    },
    {
      name: "Incline Dumbbell Press",
      sets: 3,
      bestSet: { weight: 32, reps: 10 },
      totalVolume: 1920,
    },
    {
      name: "Cable Flyes",
      sets: 3,
      bestSet: { weight: 15, reps: 15 },
      totalVolume: 630,
    },
    {
      name: "Overhead Press",
      sets: 3,
      bestSet: { weight: 50, reps: 8 },
      totalVolume: 1200,
      isPR: true,
    },
    {
      name: "Lateral Raises",
      sets: 3,
      bestSet: { weight: 12, reps: 12 },
      totalVolume: 432,
    },
  ],
  caloriesBurned: 320,
  prsAchieved: 2,
  muscleGroups: ["Chest", "Shoulders", "Triceps"],
}

export function WorkoutSummary({
  data = mockSummaryData,
  onClose,
  onShare,
  className,
}: WorkoutSummaryProps) {
  const formatDuration = (minutes: number) => {
    const hrs = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hrs > 0) {
      return `${hrs}h ${mins}m`
    }
    return `${mins} min`
  }

  return (
    <GlassCard className={cn("p-6", className)}>
      {/* Header with confetti effect for PRs */}
      <div className="text-center mb-6 relative">
        {data.prsAchieved > 0 && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Simple star decorations */}
            <Star className="absolute top-0 left-1/4 h-4 w-4 text-amber-500 animate-pulse" />
            <Star className="absolute top-2 right-1/4 h-3 w-3 text-amber-400 animate-pulse delay-100" />
            <Star className="absolute top-4 left-1/3 h-2 w-2 text-amber-300 animate-pulse delay-200" />
          </div>
        )}

        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Check className="h-8 w-8 text-primary" />
        </div>

        <h2 className="text-2xl font-bold mb-1">Workout Complete!</h2>
        <p className="text-muted-foreground">{data.title} - {data.date}</p>
      </div>

      {/* PRs Alert */}
      {data.prsAchieved > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 mb-6">
          <Trophy className="h-8 w-8 text-amber-500" />
          <div>
            <p className="font-semibold text-amber-500">
              {data.prsAchieved} Personal Record{data.prsAchieved > 1 ? "s" : ""} Broken!
            </p>
            <p className="text-sm text-muted-foreground">
              Keep pushing your limits!
            </p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
          <Clock className="h-6 w-6 text-blue-500" />
          <div>
            <p className="text-2xl font-bold">{formatDuration(data.duration)}</p>
            <p className="text-xs text-muted-foreground">Duration</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
          <Dumbbell className="h-6 w-6 text-primary" />
          <div>
            <p className="text-2xl font-bold">{data.totalSets}</p>
            <p className="text-xs text-muted-foreground">Total Sets</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
          <TrendingUp className="h-6 w-6 text-purple-500" />
          <div>
            <p className="text-2xl font-bold">NA</p>
            <p className="text-xs text-muted-foreground">Volume (kg)</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50">
          <Flame className="h-6 w-6 text-orange-500" />
          <div>
            <p className="text-2xl font-bold">NA</p>
            <p className="text-xs text-muted-foreground">Calories</p>
          </div>
        </div>
      </div>

      {/* Muscle Groups */}
      <div className="mb-6">
        <p className="text-sm text-muted-foreground mb-2">Muscles Worked</p>
        <div className="flex flex-wrap gap-2">
          {data.muscleGroups.map((muscle) => (
            <span
              key={muscle}
              className="px-3 py-1 text-sm rounded-full bg-primary/10 text-primary"
            >
              {muscle}
            </span>
          ))}
        </div>
      </div>

      {/* Exercise List */}
      <div className="mb-6">
        <p className="text-sm text-muted-foreground mb-3">Exercises</p>
        <div className="space-y-2">
          {data.exercises.map((exercise, idx) => (
            <div
              key={idx}
              className={cn(
                "flex items-center justify-between p-3 rounded-lg",
                exercise.isPR ? "bg-amber-500/10 border border-amber-500/30" : "bg-secondary/30"
              )}
            >
              <div className="flex items-center gap-3">
                {exercise.isPR && <Trophy className="h-4 w-4 text-amber-500" />}
                <div>
                  <p className="font-medium">{exercise.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {exercise.sets} sets • Best: {exercise.bestSet.weight}kg × {exercise.bestSet.reps}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">NA</p>
                <p className="text-xs text-muted-foreground">volume</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onShare}>
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
        <Button className="flex-1" onClick={onClose}>
          Done
        </Button>
      </div>
    </GlassCard>
  )
}
