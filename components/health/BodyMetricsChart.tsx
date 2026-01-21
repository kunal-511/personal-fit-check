"use client"

import { useMemo, useState } from "react"
import { TrendingDown, TrendingUp, Scale, Activity } from "lucide-react"
import { GlassCard } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { BodyMetrics } from "@/types"

interface BodyMetricsChartProps {
  data: BodyMetrics[]
  isLoading?: boolean
  className?: string
}

type MetricType = "weight" | "bodyFat" | "waist" | "chest"

const metricConfig: Record<MetricType, {
  label: string
  unit: string
  field: keyof BodyMetrics
  color: string
  icon: typeof Scale
}> = {
  weight: {
    label: "Weight",
    unit: "kg",
    field: "weight_kg",
    color: "bg-primary",
    icon: Scale,
  },
  bodyFat: {
    label: "Body Fat",
    unit: "%",
    field: "body_fat_percent",
    color: "bg-purple-500",
    icon: Activity,
  },
  waist: {
    label: "Waist",
    unit: "cm",
    field: "waist_cm",
    color: "bg-amber-500",
    icon: Activity,
  },
  chest: {
    label: "Chest",
    unit: "cm",
    field: "chest_cm",
    color: "bg-blue-500",
    icon: Activity,
  },
}

export function BodyMetricsChart({
  data,
  isLoading,
  className,
}: BodyMetricsChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>("weight")

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []

    const config = metricConfig[selectedMetric]
    const field = config.field

    return data
      .filter((d) => d[field] != null)
      .map((d) => ({
        date: d.date,
        value: d[field] as number,
        label: new Date(d.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
      }))
      .reverse() // Oldest first for chart
  }, [data, selectedMetric])

  const stats = useMemo(() => {
    if (chartData.length === 0) return null

    const values = chartData.map((d) => d.value)
    const current = chartData[chartData.length - 1]?.value ?? 0
    const first = chartData[0]?.value ?? 0
    const change = current - first
    const min = Math.min(...values)
    const max = Math.max(...values)

    return {
      current,
      change,
      min,
      max,
      trend: change < 0 ? "down" : change > 0 ? "up" : "stable",
    }
  }, [chartData])

  const config = metricConfig[selectedMetric]

  if (isLoading) {
    return (
      <GlassCard className={cn("p-6", className)}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-8 w-48" />
          </div>
          <Skeleton className="h-48 w-full" />
        </div>
      </GlassCard>
    )
  }

  return (
    <GlassCard className={cn("p-6", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-xl",
            selectedMetric === "weight" ? "bg-primary/10" : "bg-secondary"
          )}>
            <config.icon className={cn(
              "h-5 w-5",
              selectedMetric === "weight" ? "text-primary" : "text-muted-foreground"
            )} />
          </div>
          <div>
            <h2 className="font-semibold">{config.label} Trend</h2>
            <p className="text-sm text-muted-foreground">
              Last {chartData.length} entries
            </p>
          </div>
        </div>

        {/* Metric Selector */}
        <div className="flex gap-1 p-1 rounded-lg bg-secondary/50">
          {(Object.keys(metricConfig) as MetricType[]).map((metric) => (
            <Button
              key={metric}
              variant={selectedMetric === metric ? "default" : "ghost"}
              size="sm"
              className="text-xs"
              onClick={() => setSelectedMetric(metric)}
            >
              {metricConfig[metric].label}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 rounded-lg bg-secondary/30">
            <p className="text-xs text-muted-foreground">Current</p>
            <p className="text-xl font-bold">
              {stats.current.toFixed(1)}{config.unit}
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-secondary/30">
            <p className="text-xs text-muted-foreground">Change</p>
            <p className={cn(
              "text-xl font-bold flex items-center justify-center gap-1",
              stats.trend === "down" ? "text-primary" : stats.trend === "up" ? "text-amber-500" : ""
            )}>
              {stats.trend === "down" && <TrendingDown className="h-4 w-4" />}
              {stats.trend === "up" && <TrendingUp className="h-4 w-4" />}
              {stats.change > 0 ? "+" : ""}{stats.change.toFixed(1)}{config.unit}
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-secondary/30">
            <p className="text-xs text-muted-foreground">Range</p>
            <p className="text-xl font-bold">
              {stats.min.toFixed(1)}-{stats.max.toFixed(1)}
            </p>
          </div>
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 ? (
        <div className="h-48">
          <div className="h-full flex items-end gap-1">
            {chartData.map((point, index) => {
              const min = stats?.min ?? 0
              const max = stats?.max ?? 100
              const range = max - min || 1
              const heightPercent = ((point.value - min) / range) * 80 + 10

              return (
                <div
                  key={point.date}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <span className="text-xs text-muted-foreground">
                    {point.value.toFixed(1)}
                  </span>
                  <div
                    className={cn(
                      "w-full rounded-t-md transition-all",
                      config.color,
                      index === chartData.length - 1 ? "opacity-100" : "opacity-60"
                    )}
                    style={{ height: `${heightPercent}%` }}
                  />
                  <span className="text-[10px] text-muted-foreground">
                    {point.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="h-48 flex items-center justify-center rounded-lg bg-secondary/30">
          <div className="text-center">
            <Scale className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">
              No {config.label.toLowerCase()} data yet
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Start logging to see your trends
            </p>
          </div>
        </div>
      )}
    </GlassCard>
  )
}
