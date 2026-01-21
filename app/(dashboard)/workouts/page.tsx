"use client"

import { useState, useEffect } from "react"
import { Plus, Dumbbell, Play, Clock, Flame, ChevronRight, Trophy } from "lucide-react"
import Link from "next/link"
import { GlassCard } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { cn, formatDate } from "@/lib/utils"
import { workoutsApi } from "@/lib/api"
import type { Workout } from "@/types"

const quickWorkouts = [
  { id: "push", title: "Push Day", exercises: 5, duration: "45-60 min", muscles: ["Chest", "Shoulders", "Triceps"] },
  { id: "pull", title: "Pull Day", exercises: 6, duration: "45-60 min", muscles: ["Back", "Biceps"] },
  { id: "legs", title: "Leg Day", exercises: 6, duration: "50-65 min", muscles: ["Quads", "Hamstrings", "Glutes"] },
  { id: "cardio", title: "Cardio", exercises: 1, duration: "20-45 min", muscles: ["Full Body"] },
]

export default function WorkoutsPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTab, setSelectedTab] = useState("overview")

  useEffect(() => {
    async function fetchWorkouts() {
      try {
        const res = await workoutsApi.getAll(20)
        setWorkouts(res?.workouts || [])
      } catch (error) {
        console.error("Failed to fetch workouts:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchWorkouts()
  }, [])

  // Calculate weekly stats
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const weeklyWorkouts = workouts.filter(w => new Date(w.date) >= weekAgo)
  const weeklyStats = {
    completed: weeklyWorkouts.length,
    target: 5,
    totalDuration: weeklyWorkouts.reduce((acc, w) => acc + (w.duration_minutes || 0), 0),
  }

  if (loading) {
    return <WorkoutsSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Workouts</h1>
          <p className="text-muted-foreground">Track your training</p>
        </div>
        <Link href="/workouts/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Workout
          </Button>
        </Link>
      </div>

      {/* View Toggle */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="w-full max-w-md">
          <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
          <TabsTrigger value="history" className="flex-1">History</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Weekly Progress */}
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">This Week</h2>
            </div>

            <div className="flex items-center gap-6 mb-6">
              <div className="flex-1">
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-bold">{weeklyStats.completed}</span>
                  <span className="text-muted-foreground">/ {weeklyStats.target} workouts</span>
                </div>
                <Progress
                  value={(weeklyStats.completed / weeklyStats.target) * 100}
                  className="h-3"
                />
              </div>
            </div>

            {/* Weekly Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 rounded-lg bg-secondary/50">
                <p className="text-xs text-muted-foreground">Volume</p>
                <p className="text-lg font-bold">NA</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-secondary/50">
                <p className="text-xs text-muted-foreground">Time</p>
                <p className="text-lg font-bold">{Math.floor(weeklyStats.totalDuration / 60)}h {weeklyStats.totalDuration % 60}m</p>
              </div>
            </div>
          </GlassCard>

          {/* Quick Start */}
          <div>
            <h2 className="mb-3 font-semibold">Quick Start</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {quickWorkouts.map((workout) => (
                <Link key={workout.id} href={`/workouts/active?template=${workout.id}`}>
                  <GlassCard className="cursor-pointer p-4 transition-all hover:bg-white/[0.07]">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Dumbbell className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{workout.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {workout.exercises} exercises
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {workout.muscles.slice(0, 2).map((muscle) => (
                        <span key={muscle} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary">
                          {muscle}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{workout.duration}</span>
                      <Play className="h-4 w-4 text-primary" />
                    </div>
                  </GlassCard>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Workouts Preview */}
          {workouts.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold">Recent Workouts</h2>
                <Button variant="ghost" size="sm" onClick={() => setSelectedTab("history")}>
                  View all
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-3">
                {workouts.slice(0, 3).map((workout) => (
                  <WorkoutCard key={workout.id} workout={workout} />
                ))}
              </div>
            </div>
          )}

          {workouts.length === 0 && (
            <GlassCard className="p-12">
              <div className="flex flex-col items-center justify-center">
                <Dumbbell className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-lg font-medium mb-2">No workouts yet</p>
                <p className="text-sm text-muted-foreground text-center mb-4">
                  Start your fitness journey by logging your first workout
                </p>
                <Link href="/workouts/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Start First Workout
                  </Button>
                </Link>
              </div>
            </GlassCard>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6 mt-6">
          <h2 className="font-semibold">All Workouts</h2>

          {workouts.length > 0 ? (
            <div className="space-y-3">
              {workouts.map((workout) => (
                <WorkoutCard key={workout.id} workout={workout} />
              ))}
            </div>
          ) : (
            <GlassCard className="p-12">
              <div className="flex flex-col items-center justify-center">
                <Dumbbell className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No workout history</p>
                <Link href="/workouts/new" className="mt-2 text-sm text-primary hover:underline">
                  Log your first workout
                </Link>
              </div>
            </GlassCard>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function WorkoutCard({ workout }: { workout: Workout }) {
  return (
    <Link href={`/workouts/history/${workout.id}`}>
      <GlassCard className="p-4 hover:bg-white/[0.05] transition-colors cursor-pointer">
        <div className="flex items-center gap-4">
          <div className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
            workout.workout_type === "strength" ? "bg-primary/10" : "bg-orange-500/10"
          )}>
            <Dumbbell className={cn(
              "h-6 w-6",
              workout.workout_type === "strength" ? "text-primary" : "text-orange-500"
            )} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium truncate">{workout.title}</p>
            </div>
            <div className="mt-1 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {workout.duration_minutes || 0} min
              </span>
              <span className="capitalize">{workout.workout_type}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{formatDate(workout.date)}</span>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </GlassCard>
    </Link>
  )
}

function WorkoutsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-32 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-10 w-full max-w-md" />
      <GlassCard className="p-6">
        <Skeleton className="h-32" />
      </GlassCard>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <GlassCard key={i} className="p-4">
            <Skeleton className="h-24" />
          </GlassCard>
        ))}
      </div>
    </div>
  )
}
