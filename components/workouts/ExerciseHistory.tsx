"use client"

import { useState } from "react"
import { History, Trophy, TrendingUp, TrendingDown, ChevronRight, Calendar } from "lucide-react"
import { GlassCard } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SetRecord {
  setNumber: number
  weight: number
  reps: number
  rpe?: number
}

interface ExerciseSession {
  id: string
  date: string
  workoutTitle: string
  sets: SetRecord[]
  totalVolume: number
  maxWeight: number
  notes?: string
}

interface ExerciseHistoryData {
  exerciseName: string
  muscleGroup: string
  sessions: ExerciseSession[]
  personalRecord: {
    weight: number
    reps: number
    date: string
  }
  totalSessions: number
}

interface ExerciseHistoryProps {
  data?: ExerciseHistoryData
  className?: string
  onSessionClick?: (sessionId: string) => void
}

const mockHistoryData: ExerciseHistoryData = {
  exerciseName: "Bench Press",
  muscleGroup: "Chest",
  sessions: [
    {
      id: "1",
      date: "Jan 19, 2026",
      workoutTitle: "Push Day",
      sets: [
        { setNumber: 1, weight: 82.5, reps: 8, rpe: 8 },
        { setNumber: 2, weight: 82.5, reps: 7, rpe: 8.5 },
        { setNumber: 3, weight: 80, reps: 8, rpe: 9 },
        { setNumber: 4, weight: 80, reps: 6, rpe: 9.5 },
      ],
      totalVolume: 2380,
      maxWeight: 82.5,
      notes: "Felt strong today, PR on first set!",
    },
    {
      id: "2",
      date: "Jan 14, 2026",
      workoutTitle: "Chest Day",
      sets: [
        { setNumber: 1, weight: 80, reps: 9, rpe: 8 },
        { setNumber: 2, weight: 80, reps: 8, rpe: 8 },
        { setNumber: 3, weight: 80, reps: 7, rpe: 9 },
        { setNumber: 4, weight: 77.5, reps: 8, rpe: 9 },
      ],
      totalVolume: 2540,
      maxWeight: 80,
    },
    {
      id: "3",
      date: "Jan 9, 2026",
      workoutTitle: "Push Day",
      sets: [
        { setNumber: 1, weight: 80, reps: 8, rpe: 8 },
        { setNumber: 2, weight: 80, reps: 8, rpe: 8.5 },
        { setNumber: 3, weight: 77.5, reps: 9, rpe: 8.5 },
        { setNumber: 4, weight: 77.5, reps: 7, rpe: 9 },
      ],
      totalVolume: 2475,
      maxWeight: 80,
    },
    {
      id: "4",
      date: "Jan 4, 2026",
      workoutTitle: "Chest & Triceps",
      sets: [
        { setNumber: 1, weight: 77.5, reps: 10, rpe: 7.5 },
        { setNumber: 2, weight: 77.5, reps: 9, rpe: 8 },
        { setNumber: 3, weight: 77.5, reps: 8, rpe: 8.5 },
      ],
      totalVolume: 2092,
      maxWeight: 77.5,
    },
    {
      id: "5",
      date: "Dec 30, 2025",
      workoutTitle: "Push Day",
      sets: [
        { setNumber: 1, weight: 75, reps: 10, rpe: 7 },
        { setNumber: 2, weight: 75, reps: 10, rpe: 7.5 },
        { setNumber: 3, weight: 75, reps: 9, rpe: 8 },
        { setNumber: 4, weight: 72.5, reps: 10, rpe: 8.5 },
      ],
      totalVolume: 2900,
      maxWeight: 75,
    },
  ],
  personalRecord: {
    weight: 82.5,
    reps: 8,
    date: "Jan 19, 2026",
  },
  totalSessions: 24,
}

export function ExerciseHistory({
  data = mockHistoryData,
  className,
  onSessionClick,
}: ExerciseHistoryProps) {
  const [expandedSession, setExpandedSession] = useState<string | null>(null)

  // Calculate stats
  const avgVolume = Math.round(
    data.sessions.reduce((acc, s) => acc + s.totalVolume, 0) / data.sessions.length
  )
  const latestVolume = data.sessions[0]?.totalVolume || 0
  const volumeTrend = latestVolume >= avgVolume ? "up" : "down"

  return (
    <GlassCard className={cn("p-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <History className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">{data.exerciseName}</h2>
            <p className="text-sm text-muted-foreground">{data.muscleGroup}</p>
          </div>
        </div>

        {/* PR Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
          <Trophy className="h-4 w-4 text-amber-500" />
          <span className="text-sm font-medium text-amber-500">
            PR: {data.personalRecord.weight}kg × {data.personalRecord.reps}
          </span>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="text-center p-3 rounded-lg bg-secondary/50">
          <p className="text-xs text-muted-foreground">Sessions</p>
          <p className="text-xl font-bold">{data.totalSessions}</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-secondary/50">
          <p className="text-xs text-muted-foreground">Avg Volume</p>
          <p className="text-xl font-bold">{avgVolume}</p>
        </div>
        <div className="text-center p-3 rounded-lg bg-secondary/50">
          <p className="text-xs text-muted-foreground">Trend</p>
          <div className="flex items-center justify-center gap-1">
            {volumeTrend === "up" ? (
              <TrendingUp className="h-4 w-4 text-primary" />
            ) : (
              <TrendingDown className="h-4 w-4 text-amber-500" />
            )}
            <span className={cn(
              "text-xl font-bold",
              volumeTrend === "up" ? "text-primary" : "text-amber-500"
            )}>
              {volumeTrend === "up" ? "+" : "-"}
              {Math.abs(Math.round(((latestVolume - avgVolume) / avgVolume) * 100))}%
            </span>
          </div>
        </div>
      </div>

      {/* Session History */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium">Recent Sessions</h3>
          <Button variant="ghost" size="sm" className="text-xs">
            View All
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>

        <div className="space-y-2">
          {data.sessions.map((session, idx) => {
            const isExpanded = expandedSession === session.id
            const isPR = session.maxWeight === data.personalRecord.weight && idx === 0

            return (
              <div
                key={session.id}
                className={cn(
                  "rounded-lg border border-border/50 overflow-hidden transition-all",
                  isExpanded && "ring-1 ring-primary/50"
                )}
              >
                {/* Session Header */}
                <button
                  className="w-full flex items-center justify-between p-3 hover:bg-secondary/30 transition-colors"
                  onClick={() => setExpandedSession(isExpanded ? null : session.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {session.date}
                    </div>
                    {isPR && (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-500/10 text-amber-500">
                        PR
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">{session.maxWeight}kg</p>
                      <p className="text-xs text-muted-foreground">{session.sets.length} sets</p>
                    </div>
                    <ChevronRight className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform",
                      isExpanded && "rotate-90"
                    )} />
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-3 pb-3 border-t border-border/50 bg-secondary/20">
                    <p className="text-xs text-muted-foreground py-2">{session.workoutTitle}</p>

                    {/* Sets Table */}
                    <div className="rounded-lg bg-background/50 overflow-hidden">
                      <div className="grid grid-cols-4 gap-2 px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border/50">
                        <span>Set</span>
                        <span>Weight</span>
                        <span>Reps</span>
                        <span>RPE</span>
                      </div>
                      {session.sets.map((set) => (
                        <div
                          key={set.setNumber}
                          className="grid grid-cols-4 gap-2 px-3 py-2 text-sm border-b border-border/30 last:border-0"
                        >
                          <span className="text-muted-foreground">{set.setNumber}</span>
                          <span className="font-medium">{set.weight}kg</span>
                          <span>{set.reps}</span>
                          <span className="text-muted-foreground">{set.rpe || "-"}</span>
                        </div>
                      ))}
                    </div>

                    {/* Volume */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                      <span className="text-sm text-muted-foreground">Total Volume</span>
                      <span className="text-sm font-medium">{session.totalVolume} kg</span>
                    </div>

                    {/* Notes */}
                    {session.notes && (
                      <p className="mt-2 text-sm text-muted-foreground italic">
                        &quot;{session.notes}&quot;
                      </p>
                    )}

                    {/* Action */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-3"
                      onClick={() => onSessionClick?.(session.id)}
                    >
                      View Full Workout
                    </Button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </GlassCard>
  )
}
