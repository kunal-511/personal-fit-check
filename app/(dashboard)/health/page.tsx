"use client"

import { useEffect } from "react"
import { Heart, Scale, Moon, Activity, TrendingDown, TrendingUp, Plus } from "lucide-react"
import Link from "next/link"
import { GlassCard } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { BodyMetricsChart, SleepChart, RecoveryScoreDisplay, ProgressPhotosGallery } from "@/components/health"
import { useHealthStore, getRecoveryRecommendation } from "@/lib/health-store"
import { cn } from "@/lib/utils"

export default function HealthPage() {
  const {
    bodyMetrics,
    sleep,
    recovery,
    fetchBodyMetrics,
    fetchSleep,
    fetchRecovery,
  } = useHealthStore()

  // Fetch data on mount
  useEffect(() => {
    fetchBodyMetrics(30)
    fetchSleep(7)
    fetchRecovery()
  }, [fetchBodyMetrics, fetchSleep, fetchRecovery])

  const isLoading = bodyMetrics.isLoading || sleep.isLoading || recovery.isLoading

  // Calculate recovery recommendation
  const recoveryScore = recovery.today?.recovery_score ?? 0
  const recoveryRecommendation = getRecoveryRecommendation(recoveryScore)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Health</h1>
          <p className="text-muted-foreground">Track your body metrics</p>
        </div>
        <Link href="/health/body">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Log Metrics
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Weight */}
        <GlassCard className="p-4">
          {bodyMetrics.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <Scale className="h-5 w-5 text-primary" />
                {bodyMetrics.changes && (
                  <span className={cn(
                    "flex items-center text-xs font-medium",
                    bodyMetrics.changes.weight < 0 ? "text-primary" : "text-amber-500"
                  )}>
                    {bodyMetrics.changes.weight < 0 ? (
                      <TrendingDown className="mr-1 h-3 w-3" />
                    ) : (
                      <TrendingUp className="mr-1 h-3 w-3" />
                    )}
                    {bodyMetrics.changes.weight > 0 ? "+" : ""}
                    {bodyMetrics.changes.weight?.toFixed(1)} kg
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold">
                {bodyMetrics.latest?.weight_kg?.toFixed(1) ?? "--"} kg
              </p>
              <p className="text-xs text-muted-foreground">Current Weight</p>
            </>
          )}
        </GlassCard>

        {/* Body Fat */}
        <GlassCard className="p-4">
          {bodyMetrics.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <Activity className="h-5 w-5 text-purple-500" />
                {bodyMetrics.changes?.body_fat && (
                  <span className="flex items-center text-xs font-medium text-primary">
                    <TrendingDown className="mr-1 h-3 w-3" />
                    {bodyMetrics.changes.body_fat?.toFixed(1)}%
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold">
                {bodyMetrics.latest?.body_fat_percent?.toFixed(1) ?? "--"}%
              </p>
              <p className="text-xs text-muted-foreground">Body Fat</p>
            </>
          )}
        </GlassCard>

        {/* Sleep */}
        <GlassCard className="p-4">
          {sleep.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <Moon className="h-5 w-5 text-blue-500" />
                {sleep.latest?.quality_rating && (
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <div
                        key={star}
                        className={cn(
                          "h-2 w-2 rounded-full",
                          star <= (sleep.latest?.quality_rating ?? 0)
                            ? "bg-blue-500"
                            : "bg-secondary"
                        )}
                      />
                    ))}
                  </div>
                )}
              </div>
              <p className="text-2xl font-bold">
                {sleep.latest?.hours_slept?.toFixed(1) ?? "--"}h
              </p>
              <p className="text-xs text-muted-foreground">Last Night</p>
            </>
          )}
        </GlassCard>

        {/* Recovery */}
        <GlassCard className="p-4">
          {recovery.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <Heart className="h-5 w-5 text-red-500" />
                <span className={cn("text-xs font-medium capitalize", recoveryRecommendation.color)}>
                  {recoveryRecommendation.status}
                </span>
              </div>
              <p className="text-2xl font-bold">
                {recovery.today?.recovery_score ?? "--"}%
              </p>
              <p className="text-xs text-muted-foreground">Recovery Score</p>
            </>
          )}
        </GlassCard>
      </div>

      {/* Recovery Details */}
      <RecoveryScoreDisplay
        recovery={recovery.today}
        sleep={recovery.sleep}
        heartRate={recovery.heartRate}
        isLoading={recovery.isLoading}
        onSuccess={() => fetchRecovery()}
      />

      {/* Body Measurements */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Body Measurements</h2>
          <Link href="/health/body">
            <Button variant="ghost" size="sm">Update</Button>
          </Link>
        </div>

        {bodyMetrics.isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="text-center">
                <Skeleton className="h-8 w-16 mx-auto" />
                <Skeleton className="h-4 w-12 mx-auto mt-2" />
              </div>
            ))}
          </div>
        ) : bodyMetrics.latest ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { key: "chest_cm", label: "Chest" },
              { key: "waist_cm", label: "Waist" },
              { key: "left_arm_cm", label: "Arms" },
              { key: "left_thigh_cm", label: "Thighs" },
            ].map(({ key, label }) => {
              const value = bodyMetrics.latest?.[key as keyof typeof bodyMetrics.latest]
              return (
                <div key={key} className="text-center">
                  <p className="text-2xl font-bold">{value ?? "--"}</p>
                  <p className="text-xs text-muted-foreground">{label} (cm)</p>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Scale className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No measurements logged yet</p>
            <Link href="/health/body">
              <Button variant="outline" size="sm" className="mt-2">
                Log your first measurement
              </Button>
            </Link>
          </div>
        )}
      </GlassCard>

      {/* Weight Chart */}
      <BodyMetricsChart
        data={bodyMetrics.history}
        isLoading={bodyMetrics.isLoading}
      />

      {/* Sleep Chart */}
      <SleepChart
        data={sleep.history}
        isLoading={sleep.isLoading}
      />

      {/* Progress Photos */}
      <ProgressPhotosGallery />
    </div>
  )
}
