"use client"

import { useEffect, useState } from "react"
import { Utensils, Dumbbell, Heart, Droplets, TrendingUp, Flame} from "lucide-react"
import Link from "next/link"
import { GlassCard } from "@/components/ui/card"
import { CircularProgress, Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { cn, getGreeting, formatNumber, formatDate } from "@/lib/utils"
import { nutritionApi, workoutsApi, healthApi } from "@/lib/api"
import type { DailyNutrition, Workout } from "@/types"

interface DashboardData {
  nutrition: DailyNutrition | null
  water: { total: number; target: number }
  workouts: Workout[]
  health: {
    weight: number | null
    weightChange: number | null
    recovery: number | null
    sleep: number | null
  }
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const [nutritionRes, waterRes, workoutsRes, healthRes] = await Promise.all([
          nutritionApi.getDaily().catch(() => null),
          nutritionApi.getWater().catch(() => ({ total: 0, logs: [] })),
          workoutsApi.getAll(5).catch(() => ({ workouts: [] })),
          healthApi.getBodyMetrics(30).catch(() => ({ latest: null, changes: null })),
        ])

        // Try to get recovery data
        const recoveryRes = await healthApi.getRecovery().catch(() => null)

        setData({
          nutrition: nutritionRes,
          water: {
            total: waterRes?.total || 0,
            target: nutritionRes?.goals?.water_ml || 4000,
          },
          workouts: workoutsRes?.workouts || [],
          health: {
            weight: healthRes?.latest?.weight_kg || null,
            weightChange: healthRes?.changes?.weight || null,
            recovery: recoveryRes?.recovery?.recovery_score || null,
            sleep: recoveryRes?.sleep?.hours_slept || null,
          },
        })
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return <DashboardSkeleton />
  }

  // Default values if no data
  const nutrition = data?.nutrition || {
    totals: { calories: 0, protein: 0, carbs: 0, fats: 0 },
    goals: { daily_calories: 1900, protein_g: 110, carbs_g: 230, fats_g: 60, water_ml: 4000 },
    meals: [],
  }
  const water = data?.water || { total: 0, target: 4000 }
  const workouts = data?.workouts || []
  const health = data?.health || { weight: null, weightChange: null, recovery: null, sleep: null }

  const caloriePercentage = Math.round((nutrition.totals.calories / (nutrition.goals.daily_calories || 1900)) * 100)
  const waterPercentage = Math.round((water.total / water.target) * 100)
  const workoutsThisWeek = workouts.filter(w => {
    const workoutDate = new Date(w.date)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return workoutDate >= weekAgo
  }).length

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold">{getGreeting()}</h1>
        <p className="text-muted-foreground">Here&apos;s your fitness overview for today</p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Calories Card */}
        <Link href="/nutrition">
          <GlassCard className="p-4 cursor-pointer hover:bg-white/[0.07] transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Calories</p>
                <p className="text-2xl font-bold">
                  {formatNumber(nutrition.totals.calories)}
                  <span className="text-sm font-normal text-muted-foreground">
                    /{formatNumber(nutrition.goals.daily_calories || 1900)}
                  </span>
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/10">
                <Flame className="h-6 w-6 text-orange-500" />
              </div>
            </div>
            <Progress
              value={Math.min(100, caloriePercentage)}
              className="mt-3 h-1.5"
              indicatorClassName="bg-orange-500"
            />
          </GlassCard>
        </Link>

        {/* Water Card */}
        <Link href="/nutrition">
          <GlassCard className="p-4 cursor-pointer hover:bg-white/[0.07] transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Water</p>
                <p className="text-2xl font-bold">
                  {(water.total / 1000).toFixed(1)}L
                  <span className="text-sm font-normal text-muted-foreground">
                    /{(water.target / 1000).toFixed(1)}L
                  </span>
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
                <Droplets className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            <Progress
              value={Math.min(100, waterPercentage)}
              className="mt-3 h-1.5"
              indicatorClassName="bg-blue-500"
            />
          </GlassCard>
        </Link>

        {/* Workouts Card */}
        <Link href="/workouts">
          <GlassCard className="p-4 cursor-pointer hover:bg-white/[0.07] transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Workouts</p>
                <p className="text-2xl font-bold">
                  {workoutsThisWeek}
                  <span className="text-sm font-normal text-muted-foreground">
                    /5 this week
                  </span>
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Dumbbell className="h-6 w-6 text-primary" />
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {workouts[0]?.title || "No recent workouts"}
            </p>
          </GlassCard>
        </Link>

        {/* Recovery Card */}
        <Link href="/health">
          <GlassCard className="p-4 cursor-pointer hover:bg-white/[0.07] transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Recovery</p>
                <p className="text-2xl font-bold">
                  {health.recovery !== null ? `${health.recovery}%` : "--"}
                  {health.recovery !== null && (
                    <span className={cn(
                      "text-sm font-normal ml-1",
                      health.recovery >= 80 ? "text-green-500" :
                      health.recovery >= 60 ? "text-primary" :
                      health.recovery >= 40 ? "text-amber-500" : "text-red-500"
                    )}>
                      {health.recovery >= 80 ? "Excellent" :
                       health.recovery >= 60 ? "Good" :
                       health.recovery >= 40 ? "Moderate" : "Low"}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/10">
                <Heart className="h-6 w-6 text-purple-500" />
              </div>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
              {health.sleep ? `${health.sleep}hrs sleep last night` : "Log sleep to see recovery"}
            </p>
          </GlassCard>
        </Link>
      </div>

      {/* Macro Rings & Weight Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Macro Rings */}
        <GlassCard className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Utensils className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Today&apos;s Macros</h2>
            </div>
            <Link href="/nutrition/log" className="text-xs text-primary hover:underline">
              + Log meal
            </Link>
          </div>

          <div className="flex items-center justify-around">
            {/* Protein Ring */}
            <div className="flex flex-col items-center">
              <CircularProgress
                value={nutrition.totals.protein}
                max={nutrition.goals.protein_g || 110}
                size={100}
                strokeWidth={8}
                indicatorClassName="stroke-protein"
                trackClassName="stroke-protein/20"
              >
                <div className="text-center">
                  <p className="text-lg font-bold text-protein">{Math.round(nutrition.totals.protein)}g</p>
                </div>
              </CircularProgress>
              <p className="mt-2 text-sm text-muted-foreground">Protein</p>
            </div>

            {/* Carbs Ring */}
            <div className="flex flex-col items-center">
              <CircularProgress
                value={nutrition.totals.carbs}
                max={nutrition.goals.carbs_g || 230}
                size={100}
                strokeWidth={8}
                indicatorClassName="stroke-carbs"
                trackClassName="stroke-carbs/20"
              >
                <div className="text-center">
                  <p className="text-lg font-bold text-carbs">{Math.round(nutrition.totals.carbs)}g</p>
                </div>
              </CircularProgress>
              <p className="mt-2 text-sm text-muted-foreground">Carbs</p>
            </div>

            {/* Fats Ring */}
            <div className="flex flex-col items-center">
              <CircularProgress
                value={nutrition.totals.fats}
                max={nutrition.goals.fats_g || 60}
                size={100}
                strokeWidth={8}
                indicatorClassName="stroke-fats"
                trackClassName="stroke-fats/20"
              >
                <div className="text-center">
                  <p className="text-lg font-bold text-fats">{Math.round(nutrition.totals.fats)}g</p>
                </div>
              </CircularProgress>
              <p className="mt-2 text-sm text-muted-foreground">Fats</p>
            </div>
          </div>

          {/* Macro Progress Bars */}
          <div className="mt-6 space-y-3">
            <MacroBar
              label="Protein"
              current={nutrition.totals.protein}
              target={nutrition.goals.protein_g || 110}
              color="protein"
            />
            <MacroBar
              label="Carbs"
              current={nutrition.totals.carbs}
              target={nutrition.goals.carbs_g || 230}
              color="carbs"
            />
            <MacroBar
              label="Fats"
              current={nutrition.totals.fats}
              target={nutrition.goals.fats_g || 60}
              color="fats"
            />
          </div>
        </GlassCard>

        {/* Weight Progress */}
        <GlassCard className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Weight Progress</h2>
            </div>
            <Link href="/health/body" className="text-xs text-primary hover:underline">
              + Log weight
            </Link>
          </div>

          {health.weight !== null ? (
            <>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-4xl font-bold">{health.weight}</p>
                  <p className="text-sm text-muted-foreground">kg</p>
                </div>
                {health.weightChange !== null && (
                  <div className={cn(
                    "rounded-full px-3 py-1 text-sm font-medium",
                    health.weightChange < 0
                      ? "bg-primary/10 text-primary"
                      : health.weightChange > 0
                      ? "bg-amber-500/10 text-amber-500"
                      : "bg-secondary text-muted-foreground"
                  )}>
                    {health.weightChange > 0 ? "+" : ""}{health.weightChange.toFixed(1)} kg
                  </div>
                )}
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Last 30 days progress
              </p>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <TrendingUp className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No weight data yet</p>
              <Link href="/health/body" className="mt-2 text-sm text-primary hover:underline">
                Log your first measurement
              </Link>
            </div>
          )}
        </GlassCard>
      </div>

      {/* Recent Activity */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Recent Activity</h2>
        </div>
        {workouts.length > 0 || nutrition.meals.length > 0 ? (
          <div className="space-y-3">
            {workouts.slice(0, 3).map((workout) => (
              <ActivityItem
                key={workout.id}
                icon={<Dumbbell className="h-4 w-4" />}
                title={workout.title}
                subtitle={`${workout.duration_minutes || 0} min - ${workout.workout_type}`}
                time={formatDate(workout.date)}
              />
            ))}
            {nutrition.meals.slice(0, 2).map((meal) => (
              <ActivityItem
                key={meal.id}
                icon={<Utensils className="h-4 w-4" />}
                title={`${meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1)}: ${meal.meal_name || "Meal"}`}
                subtitle={`${Math.round(meal.totals?.calories || 0)} cal`}
                time="Today"
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8">
            <p className="text-sm text-muted-foreground">No recent activity</p>
            <div className="flex gap-4 mt-3">
              <Link href="/nutrition/log" className="text-sm text-primary hover:underline">
                Log a meal
              </Link>
              <Link href="/workouts/new" className="text-sm text-primary hover:underline">
                Start a workout
              </Link>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  )
}

// Skeleton loader
function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <GlassCard key={i} className="p-4">
            <Skeleton className="h-16 w-full" />
          </GlassCard>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard className="p-6">
          <Skeleton className="h-48 w-full" />
        </GlassCard>
        <GlassCard className="p-6">
          <Skeleton className="h-48 w-full" />
        </GlassCard>
      </div>
    </div>
  )
}

// Helper Components
function MacroBar({
  label,
  current,
  target,
  color,
}: {
  label: string
  current: number
  target: number
  color: "protein" | "carbs" | "fats"
}) {
  const percentage = Math.min(100, Math.round((current / target) * 100))

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span>
          {Math.round(current)}g / {target}g
        </span>
      </div>
      <Progress
        value={percentage}
        className="h-2"
        indicatorClassName={cn(
          color === "protein" && "bg-protein",
          color === "carbs" && "bg-carbs",
          color === "fats" && "bg-fats"
        )}
      />
    </div>
  )
}

function ActivityItem({
  icon,
  title,
  subtitle,
  time,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  time: string
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{title}</p>
        <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
      </div>
      <p className="text-xs text-muted-foreground whitespace-nowrap">{time}</p>
    </div>
  )
}
