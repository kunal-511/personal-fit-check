"use client"

import { useEffect, useState } from "react"
import { ArrowLeft, Scale, TrendingDown, TrendingUp, Calendar } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { GlassCard } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { BodyMetricsForm, BodyMetricsChart } from "@/components/health"
import { useHealthStore } from "@/lib/health-store"
import { cn } from "@/lib/utils"

export default function BodyMetricsPage() {
  const { bodyMetrics, fetchBodyMetrics } = useHealthStore()
  const [selectedTab, setSelectedTab] = useState("log")

  // Fetch data on mount
  useEffect(() => {
    fetchBodyMetrics(90) // Get 90 days of history
  }, [fetchBodyMetrics])

  const handleSuccess = () => {
    setSelectedTab("history")
  }

  // Format date for display
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/health">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Body Measurements</h1>
          <p className="text-muted-foreground">Track your body composition</p>
        </div>
      </div>

      {/* Current Stats */}
      {bodyMetrics.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <GlassCard key={i} className="p-4">
              <Skeleton className="h-5 w-20 mb-2" />
              <Skeleton className="h-8 w-16" />
            </GlassCard>
          ))}
        </div>
      ) : bodyMetrics.latest && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <GlassCard className="p-4">
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
            <p className="text-xs text-muted-foreground">Weight</p>
          </GlassCard>

          <GlassCard className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-purple-500 text-lg">%</span>
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
          </GlassCard>

          <GlassCard className="p-4">
            <p className="text-xs text-muted-foreground mb-2">Waist</p>
            <p className="text-2xl font-bold">
              {bodyMetrics.latest?.waist_cm?.toFixed(1) ?? "--"} cm
            </p>
          </GlassCard>

          <GlassCard className="p-4">
            <p className="text-xs text-muted-foreground mb-2">Last Updated</p>
            <p className="text-lg font-medium">
              {bodyMetrics.latest?.date ? formatDate(bodyMetrics.latest.date) : "--"}
            </p>
          </GlassCard>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="w-full max-w-md">
          <TabsTrigger value="log" className="flex-1">Log New</TabsTrigger>
          <TabsTrigger value="history" className="flex-1">History</TabsTrigger>
          <TabsTrigger value="trends" className="flex-1">Trends</TabsTrigger>
        </TabsList>

        {/* Log Tab */}
        <TabsContent value="log" className="mt-6">
          <BodyMetricsForm
            initialData={bodyMetrics.latest ? {
              weight_kg: bodyMetrics.latest.weight_kg ?? undefined,
              body_fat_percent: bodyMetrics.latest.body_fat_percent ?? undefined,
            } : undefined}
            onSuccess={handleSuccess}
          />
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-6">
          {bodyMetrics.isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <GlassCard key={i} className="p-4">
                  <Skeleton className="h-6 w-full" />
                </GlassCard>
              ))}
            </div>
          ) : bodyMetrics.history.length > 0 ? (
            <div className="space-y-3">
              {bodyMetrics.history.map((entry) => (
                <GlassCard key={entry.date} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{formatDate(entry.date)}</p>
                        <p className="text-sm text-muted-foreground">
                          {entry.notes || "No notes"}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-6 text-right">
                      {entry.weight_kg && (
                        <div>
                          <p className="font-bold">{entry.weight_kg.toFixed(1)} kg</p>
                          <p className="text-xs text-muted-foreground">Weight</p>
                        </div>
                      )}
                      {entry.body_fat_percent && (
                        <div>
                          <p className="font-bold">{entry.body_fat_percent.toFixed(1)}%</p>
                          <p className="text-xs text-muted-foreground">Body Fat</p>
                        </div>
                      )}
                      {entry.waist_cm && (
                        <div>
                          <p className="font-bold">{entry.waist_cm.toFixed(1)} cm</p>
                          <p className="text-xs text-muted-foreground">Waist</p>
                        </div>
                      )}
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          ) : (
            <GlassCard className="p-6">
              <div className="text-center py-8">
                <Scale className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No measurements logged yet</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => setSelectedTab("log")}
                >
                  Log your first measurement
                </Button>
              </div>
            </GlassCard>
          )}
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="mt-6 space-y-6">
          <BodyMetricsChart
            data={bodyMetrics.history}
            isLoading={bodyMetrics.isLoading}
          />

          {/* Detailed Measurements */}
          {bodyMetrics.latest && (
            <GlassCard className="p-6">
              <h3 className="font-semibold mb-4">All Measurements</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: "Chest", value: bodyMetrics.latest.chest_cm },
                  { label: "Waist", value: bodyMetrics.latest.waist_cm },
                  { label: "Hips", value: bodyMetrics.latest.hips_cm },
                  { label: "Left Arm", value: bodyMetrics.latest.left_arm_cm },
                  { label: "Right Arm", value: bodyMetrics.latest.right_arm_cm },
                  { label: "Left Thigh", value: bodyMetrics.latest.left_thigh_cm },
                  { label: "Right Thigh", value: bodyMetrics.latest.right_thigh_cm },
                ].map(({ label, value }) => (
                  <div key={label} className="p-3 rounded-lg bg-secondary/30 text-center">
                    <p className="text-2xl font-bold">{value?.toFixed(1) ?? "--"}</p>
                    <p className="text-xs text-muted-foreground">{label} (cm)</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
