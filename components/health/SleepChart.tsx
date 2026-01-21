"use client"

import { useMemo } from "react"
import { Moon, Star, Clock, TrendingUp, TrendingDown } from "lucide-react"
import { GlassCard } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { SleepLog } from "@/types"

interface SleepChartProps {
  data: SleepLog[]
  isLoading?: boolean
  className?: string
}

export function SleepChart({
  data,
  isLoading,
  className,
}: SleepChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []

    return data
      .filter((d) => d.hours_slept != null)
      .map((d) => ({
        date: d.date,
        hours: d.hours_slept,
        quality: d.quality_rating || 0,
        label: new Date(d.date).toLocaleDateString("en-US", {
          weekday: "short",
        }),
        fullDate: new Date(d.date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
      }))
      .reverse() // Oldest first for chart
  }, [data])

  const stats = useMemo(() => {
    if (chartData.length === 0) return null

    const hours = chartData.map((d) => d.hours)
    const qualities = chartData.filter((d) => d.quality > 0).map((d) => d.quality)

    const avgHours = hours.reduce((a, b) => a + b, 0) / hours.length
    const avgQuality = qualities.length > 0
      ? qualities.reduce((a, b) => a + b, 0) / qualities.length
      : 0

    const current = chartData[chartData.length - 1]
    const previous = chartData.length > 1 ? chartData[chartData.length - 2] : null

    const hoursTrend = current && previous ? current.hours - previous.hours : 0

    return {
      avgHours: Math.round(avgHours * 10) / 10,
      avgQuality: Math.round(avgQuality * 10) / 10,
      hoursTrend,
      totalNights: chartData.length,
      optimalNights: hours.filter((h) => h >= 7 && h <= 9).length,
    }
  }, [chartData])

  const qualityLabels = ["", "Poor", "Fair", "Okay", "Good", "Excellent"]
  const getQualityColor = (quality: number) => {
    if (quality >= 4) return "bg-green-500"
    if (quality >= 3) return "bg-amber-500"
    return "bg-red-500"
  }

  const getHoursColor = (hours: number) => {
    if (hours >= 7 && hours <= 9) return "bg-blue-500"
    if (hours >= 6 || hours <= 10) return "bg-amber-500"
    return "bg-red-500"
  }

  if (isLoading) {
    return (
      <GlassCard className={cn("p-6", className)}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-48 w-full" />
        </div>
      </GlassCard>
    )
  }

  return (
    <GlassCard className={cn("p-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
            <Moon className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h2 className="font-semibold">Sleep Patterns</h2>
            <p className="text-sm text-muted-foreground">
              Last {chartData.length} nights
            </p>
          </div>
        </div>

        {stats && (
          <div className={cn(
            "flex items-center gap-1 text-sm",
            stats.hoursTrend > 0 ? "text-green-500" : stats.hoursTrend < 0 ? "text-red-500" : "text-muted-foreground"
          )}>
            {stats.hoursTrend > 0 && <TrendingUp className="h-4 w-4" />}
            {stats.hoursTrend < 0 && <TrendingDown className="h-4 w-4" />}
            {stats.hoursTrend !== 0 && `${stats.hoursTrend > 0 ? "+" : ""}${stats.hoursTrend.toFixed(1)}h`}
          </div>
        )}
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="text-center p-3 rounded-lg bg-blue-500/10">
            <Clock className="h-4 w-4 mx-auto mb-1 text-blue-500" />
            <p className="text-xl font-bold">{stats.avgHours}h</p>
            <p className="text-[10px] text-muted-foreground">Avg Sleep</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-amber-500/10">
            <Star className="h-4 w-4 mx-auto mb-1 text-amber-500" />
            <p className="text-xl font-bold">{stats.avgQuality.toFixed(1)}</p>
            <p className="text-[10px] text-muted-foreground">Avg Quality</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-green-500/10">
            <Moon className="h-4 w-4 mx-auto mb-1 text-green-500" />
            <p className="text-xl font-bold">{stats.optimalNights}/{stats.totalNights}</p>
            <p className="text-[10px] text-muted-foreground">7-9h Nights</p>
          </div>
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 ? (
        <div className="space-y-4">
          {/* Hours Bar Chart */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Hours of Sleep</p>
            <div className="h-32 flex items-end gap-1">
              {chartData.map((point, index) => {
                const maxHours = 12
                const heightPercent = (point.hours / maxHours) * 100

                return (
                  <div
                    key={point.date}
                    className="flex-1 flex flex-col items-center gap-1"
                  >
                    <span className="text-xs font-medium">
                      {point.hours.toFixed(1)}
                    </span>
                    <div
                      className={cn(
                        "w-full rounded-t-md transition-all",
                        getHoursColor(point.hours),
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

          {/* Quality Dots */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Sleep Quality</p>
            <div className="flex gap-1">
              {chartData.map((point) => (
                <div
                  key={point.date}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <div
                        key={star}
                        className={cn(
                          "h-2 w-2 rounded-full",
                          star <= point.quality ? getQualityColor(point.quality) : "bg-secondary"
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {point.quality > 0 ? qualityLabels[point.quality] : "-"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="h-48 flex items-center justify-center rounded-lg bg-secondary/30">
          <div className="text-center">
            <Moon className="h-8 w-8 mx-auto mb-2 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">No sleep data yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Start logging to see your patterns
            </p>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-border/50 flex flex-wrap gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm bg-blue-500" />
          <span>7-9 hours (optimal)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm bg-amber-500" />
          <span>6-7 or 9-10 hours</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-sm bg-red-500" />
          <span>&lt;6 or &gt;10 hours</span>
        </div>
      </div>
    </GlassCard>
  )
}
