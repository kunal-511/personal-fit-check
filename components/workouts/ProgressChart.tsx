"use client"

import { useState } from "react"
import { TrendingUp, ChevronDown, Trophy, Target } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { GlassCard } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ProgressDataPoint {
  week: string
  date: string
  weight: number
  reps: number
  volume: number
}

interface ExerciseProgress {
  name: string
  muscleGroup: string
  data: ProgressDataPoint[]
  personalRecord: {
    weight: number
    date: string
  }
  suggestion?: string
}

interface ProgressChartProps {
  exercises?: ExerciseProgress[]
  className?: string
}

const mockExerciseProgress: ExerciseProgress[] = [
  {
    name: "Bench Press",
    muscleGroup: "Chest",
    data: [
      { week: "W1", date: "Dec 2", weight: 70, reps: 10, volume: 2100 },
      { week: "W2", date: "Dec 9", weight: 72.5, reps: 10, volume: 2175 },
      { week: "W3", date: "Dec 16", weight: 75, reps: 9, volume: 2025 },
      { week: "W4", date: "Dec 23", weight: 77.5, reps: 8, volume: 1860 },
      { week: "W5", date: "Dec 30", weight: 77.5, reps: 9, volume: 2092 },
      { week: "W6", date: "Jan 6", weight: 80, reps: 8, volume: 1920 },
      { week: "W7", date: "Jan 13", weight: 80, reps: 9, volume: 2160 },
      { week: "W8", date: "Jan 19", weight: 82.5, reps: 8, volume: 1980 },
    ],
    personalRecord: { weight: 82.5, date: "Jan 19" },
    suggestion: "Try 85kg next session for 6-8 reps",
  },
  {
    name: "Squat",
    muscleGroup: "Legs",
    data: [
      { week: "W1", date: "Dec 3", weight: 90, reps: 8, volume: 2160 },
      { week: "W2", date: "Dec 10", weight: 92.5, reps: 8, volume: 2220 },
      { week: "W3", date: "Dec 17", weight: 95, reps: 7, volume: 1995 },
      { week: "W4", date: "Dec 24", weight: 95, reps: 8, volume: 2280 },
      { week: "W5", date: "Dec 31", weight: 97.5, reps: 7, volume: 2047 },
      { week: "W6", date: "Jan 7", weight: 100, reps: 6, volume: 1800 },
      { week: "W7", date: "Jan 14", weight: 100, reps: 7, volume: 2100 },
    ],
    personalRecord: { weight: 100, date: "Jan 7" },
    suggestion: "Maintain 100kg, aim for 8 reps",
  },
  {
    name: "Deadlift",
    muscleGroup: "Back",
    data: [
      { week: "W1", date: "Dec 4", weight: 100, reps: 6, volume: 1800 },
      { week: "W2", date: "Dec 11", weight: 105, reps: 5, volume: 1575 },
      { week: "W3", date: "Dec 18", weight: 107.5, reps: 5, volume: 1612 },
      { week: "W4", date: "Dec 25", weight: 110, reps: 5, volume: 1650 },
      { week: "W5", date: "Jan 1", weight: 112.5, reps: 4, volume: 1350 },
      { week: "W6", date: "Jan 8", weight: 112.5, reps: 5, volume: 1687 },
    ],
    personalRecord: { weight: 112.5, date: "Jan 1" },
    suggestion: "Try 115kg for 4-5 reps",
  },
]

export function ProgressChart({ exercises = mockExerciseProgress, className }: ProgressChartProps) {
  const [selectedExercise, setSelectedExercise] = useState(exercises[0])
  const [showDropdown, setShowDropdown] = useState(false)
  const [viewMode, setViewMode] = useState<"weight" | "volume">("weight")

  const data = selectedExercise.data
  const values = viewMode === "weight" ? data.map(d => d.weight) : data.map(d => d.volume)
  const maxValue = Math.max(...values)
  const minValue = Math.min(...values)
  const range = maxValue - minValue || 1

  const firstHalf = values.slice(0, Math.floor(values.length / 2))
  const secondHalf = values.slice(Math.floor(values.length / 2))
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length
  const trend = secondAvg > firstAvg ? "up" : secondAvg < firstAvg ? "down" : "stable"
  const trendPercent = Math.abs(((secondAvg - firstAvg) / firstAvg) * 100).toFixed(1)

  return (
    <GlassCard className={cn("p-6", className)}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">Progressive Overload</h2>
        </div>

        {/* Exercise Selector */}
        <div className="relative">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDropdown(!showDropdown)}
              className="min-w-[160px] justify-between"
            >
              {selectedExercise.name}
              <motion.div
                animate={{ rotate: showDropdown ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="h-4 w-4" />
              </motion.div>
            </Button>
          </motion.div>

          <AnimatePresence>
            {showDropdown && (
              <motion.div
                className="absolute right-0 top-full mt-1 z-10 w-48 rounded-lg border border-border bg-card shadow-lg overflow-hidden"
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                {exercises.map((exercise, index) => (
                  <motion.button
                    key={exercise.name}
                    className={cn(
                      "w-full px-3 py-2 text-left text-sm hover:bg-secondary/50",
                      selectedExercise.name === exercise.name && "bg-primary/10 text-primary"
                    )}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => {
                      setSelectedExercise(exercise)
                      setShowDropdown(false)
                    }}
                  >
                    <p className="font-medium">{exercise.name}</p>
                    <p className="text-xs text-muted-foreground">{exercise.muscleGroup}</p>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="flex gap-2 mb-4">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant={viewMode === "weight" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("weight")}
          >
            Weight
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            variant={viewMode === "volume" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("volume")}
          >
            Volume
          </Button>
        </motion.div>
      </div>

      {/* Chart */}
      <div className="relative h-48 mb-4">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-6 w-12 flex flex-col justify-between text-xs text-muted-foreground">
          <span>{viewMode === "weight" ? `${maxValue}kg` : maxValue}</span>
          <span>{viewMode === "weight" ? `${Math.round((maxValue + minValue) / 2)}kg` : Math.round((maxValue + minValue) / 2)}</span>
          <span>{viewMode === "weight" ? `${minValue}kg` : minValue}</span>
        </div>

        {/* Chart area */}
        <div className="ml-14 h-full flex items-end gap-1">
          {data.map((point, idx) => {
            const value = viewMode === "weight" ? point.weight : point.volume
            const height = ((value - minValue) / range) * 100
            const isLatest = idx === data.length - 1
            const isPR = viewMode === "weight" && point.weight === selectedExercise.personalRecord.weight

            return (
              <div key={point.week} className="flex-1 flex flex-col items-center gap-1">
                <div className="relative w-full h-36 flex items-end justify-center">
                  {/* Animated Bar */}
                  <motion.div
                    className={cn(
                      "w-full max-w-8 rounded-t-md",
                      isLatest ? "bg-primary" : "bg-primary/40",
                      isPR && "ring-2 ring-amber-500 ring-offset-2 ring-offset-background"
                    )}
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(10, height)}%` }}
                    transition={{
                      duration: 0.5,
                      delay: idx * 0.1,
                      ease: [0.4, 0, 0.2, 1],
                    }}
                    whileHover={{ scale: 1.05 }}
                  />
                  {/* PR indicator */}
                  {isPR && (
                    <motion.div
                      className="absolute -top-5"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 + 0.5, type: "spring" }}
                    >
                      <Trophy className="h-4 w-4 text-amber-500" />
                    </motion.div>
                  )}
                </div>
                {/* X-axis label */}
                <motion.span
                  className={cn(
                    "text-xs",
                    isLatest ? "text-primary font-medium" : "text-muted-foreground"
                  )}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.1 + 0.2 }}
                >
                  {point.week}
                </motion.span>
              </div>
            )
          })}
        </div>

        {/* Trend line overlay */}
        <motion.svg
          className="absolute ml-14 top-0 left-0 w-[calc(100%-3.5rem)] h-36 pointer-events-none"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
        >
          <motion.polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="4 2"
            className="text-primary/50"
            points={data.map((point, idx) => {
              const value = viewMode === "weight" ? point.weight : point.volume
              const x = (idx / (data.length - 1)) * 100
              const y = 100 - ((value - minValue) / range) * 100
              return `${x}%,${y}%`
            }).join(" ")}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
          />
        </motion.svg>
      </div>

      {/* Stats Row */}
      <motion.div
        className="grid grid-cols-3 gap-4 mb-4"
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.5 },
          },
        }}
      >
        <motion.div
          className="text-center p-3 rounded-lg bg-secondary/50"
          variants={{
            hidden: { opacity: 0, y: 20 },
            show: { opacity: 1, y: 0 },
          }}
          whileHover={{ scale: 1.02 }}
        >
          <p className="text-xs text-muted-foreground">Personal Record</p>
          <p className="text-lg font-bold text-amber-500">
            {selectedExercise.personalRecord.weight}kg
          </p>
          <p className="text-xs text-muted-foreground">{selectedExercise.personalRecord.date}</p>
        </motion.div>
        <motion.div
          className="text-center p-3 rounded-lg bg-secondary/50"
          variants={{
            hidden: { opacity: 0, y: 20 },
            show: { opacity: 1, y: 0 },
          }}
          whileHover={{ scale: 1.02 }}
        >
          <p className="text-xs text-muted-foreground">Trend</p>
          <p className={cn(
            "text-lg font-bold",
            trend === "up" && "text-primary",
            trend === "down" && "text-red-500",
            trend === "stable" && "text-muted-foreground"
          )}>
            {trend === "up" && "+"}
            {trend === "down" && "-"}
            {trendPercent}%
          </p>
          <p className="text-xs text-muted-foreground">Last 4 weeks</p>
        </motion.div>
        <motion.div
          className="text-center p-3 rounded-lg bg-secondary/50"
          variants={{
            hidden: { opacity: 0, y: 20 },
            show: { opacity: 1, y: 0 },
          }}
          whileHover={{ scale: 1.02 }}
        >
          <p className="text-xs text-muted-foreground">Sessions</p>
          <p className="text-lg font-bold">{data.length}</p>
          <p className="text-xs text-muted-foreground">Tracked</p>
        </motion.div>
      </motion.div>

      {/* Suggestion */}
      {selectedExercise.suggestion && (
        <motion.div
          className="flex items-start gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Target className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-primary">Next Session</p>
            <p className="text-sm text-muted-foreground">{selectedExercise.suggestion}</p>
          </div>
        </motion.div>
      )}
    </GlassCard>
  )
}
