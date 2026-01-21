"use client"

import { ArrowLeft, Moon, Heart, Activity, Battery, Zap } from "lucide-react"
import Link from "next/link"
import { GlassCard } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

// Mock data
const recoveryData = {
  overall: 78,
  sleep: {
    hours: 7.5,
    quality: 4,
    deepSleep: 1.8,
    remSleep: 1.5,
  },
  hrv: 65,
  restingHr: 58,
  musclesSoreness: 3,
  energyLevel: 4,
  stress: 2,
}

const recoveryHistory = [
  { date: "Today", score: 78 },
  { date: "Yesterday", score: 72 },
  { date: "2 days ago", score: 85 },
  { date: "3 days ago", score: 65 },
  { date: "4 days ago", score: 80 },
]

export default function RecoveryPage() {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-primary"
    if (score >= 60) return "text-amber-500"
    return "text-red-500"
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent"
    if (score >= 60) return "Good"
    if (score >= 40) return "Fair"
    return "Poor"
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
          <h1 className="text-2xl font-bold">Recovery</h1>
          <p className="text-muted-foreground">Track your body&apos;s readiness</p>
        </div>
      </div>

      {/* Overall Score */}
      <GlassCard className="p-8 text-center">
        <p className="text-sm text-muted-foreground mb-2">Today&apos;s Recovery Score</p>
        <p className={cn("text-7xl font-bold", getScoreColor(recoveryData.overall))}>
          {recoveryData.overall}
        </p>
        <p className={cn("text-xl font-medium mt-2", getScoreColor(recoveryData.overall))}>
          {getScoreLabel(recoveryData.overall)}
        </p>
        <p className="text-sm text-muted-foreground mt-4">
          You&apos;re ready for a moderate to intense workout today.
        </p>
      </GlassCard>

      {/* Breakdown */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Sleep */}
        <GlassCard className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
              <Moon className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="font-medium">Sleep</p>
              <p className="text-sm text-muted-foreground">{recoveryData.sleep.hours}h last night</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Quality</span>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <div
                    key={star}
                    className={cn(
                      "h-2 w-4 rounded-full",
                      star <= recoveryData.sleep.quality
                        ? "bg-blue-500"
                        : "bg-secondary"
                    )}
                  />
                ))}
              </div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Deep Sleep</span>
              <span>{recoveryData.sleep.deepSleep}h</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">REM Sleep</span>
              <span>{recoveryData.sleep.remSleep}h</span>
            </div>
          </div>
        </GlassCard>

        {/* Heart Rate */}
        <GlassCard className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
              <Heart className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="font-medium">Heart Rate</p>
              <p className="text-sm text-muted-foreground">Cardiovascular readiness</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">HRV</span>
              <span className="font-medium">{recoveryData.hrv} ms</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Resting HR</span>
              <span className="font-medium">{recoveryData.restingHr} bpm</span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Subjective Metrics */}
      <GlassCard className="p-6">
        <h2 className="mb-4 font-semibold">How do you feel?</h2>
        <div className="space-y-4">
          {/* Muscle Soreness */}
          <div>
            <div className="flex justify-between mb-2">
              <Label className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Muscle Soreness
              </Label>
              <span className="text-sm text-muted-foreground">
                {recoveryData.musclesSoreness}/5
              </span>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  className={cn(
                    "flex-1 h-8 rounded-lg text-sm font-medium transition-colors",
                    level <= recoveryData.musclesSoreness
                      ? "bg-amber-500/20 text-amber-500"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                  )}
                >
                  {level}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">1 = None, 5 = Very sore</p>
          </div>

          {/* Energy Level */}
          <div>
            <div className="flex justify-between mb-2">
              <Label className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Energy Level
              </Label>
              <span className="text-sm text-muted-foreground">
                {recoveryData.energyLevel}/5
              </span>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  className={cn(
                    "flex-1 h-8 rounded-lg text-sm font-medium transition-colors",
                    level <= recoveryData.energyLevel
                      ? "bg-primary/20 text-primary"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                  )}
                >
                  {level}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">1 = Exhausted, 5 = Energized</p>
          </div>

          {/* Stress */}
          <div>
            <div className="flex justify-between mb-2">
              <Label className="flex items-center gap-2">
                <Battery className="h-4 w-4" />
                Stress Level
              </Label>
              <span className="text-sm text-muted-foreground">
                {recoveryData.stress}/5
              </span>
            </div>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  className={cn(
                    "flex-1 h-8 rounded-lg text-sm font-medium transition-colors",
                    level <= recoveryData.stress
                      ? "bg-purple-500/20 text-purple-500"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                  )}
                >
                  {level}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">1 = Relaxed, 5 = Very stressed</p>
          </div>
        </div>

        <Button className="w-full mt-6">Update Recovery</Button>
      </GlassCard>

      {/* History */}
      <GlassCard className="p-6">
        <h2 className="mb-4 font-semibold">Recent History</h2>
        <div className="space-y-3">
          {recoveryHistory.map((entry) => (
            <div key={entry.date} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{entry.date}</span>
              <div className="flex items-center gap-3">
                <Progress
                  value={entry.score}
                  className="w-24 h-2"
                  indicatorClassName={cn(
                    entry.score >= 80 && "bg-primary",
                    entry.score >= 60 && entry.score < 80 && "bg-amber-500",
                    entry.score < 60 && "bg-red-500"
                  )}
                />
                <span className={cn("text-sm font-medium w-8", getScoreColor(entry.score))}>
                  {entry.score}
                </span>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}
