"use client"

import { useState } from "react"
import { Heart, Moon, Zap, Activity, Loader2, Check, Info } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { GlassCard } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { useHealthStore, calculateRecoveryScore, getRecoveryRecommendation } from "@/lib/health-store"
import { cn } from "@/lib/utils"
import type { RecoveryScore as RecoveryScoreType, SleepLog, HeartRateLog } from "@/types"

interface RecoveryScoreProps {
  recovery?: RecoveryScoreType | null
  sleep?: SleepLog | null
  heartRate?: HeartRateLog | null
  isLoading?: boolean
  showLogger?: boolean
  onSuccess?: () => void
  className?: string
}

export function RecoveryScoreDisplay({
  recovery,
  sleep,
  heartRate,
  isLoading,
  showLogger = false,
  onSuccess,
  className,
}: RecoveryScoreProps) {
  const { saveRecovery, saveHeartRate } = useHealthStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showForm, setShowForm] = useState(showLogger)

  const [muscleSoreness, setMuscleSoreness] = useState<number>(recovery?.muscle_soreness || 3)
  const [energyLevel, setEnergyLevel] = useState<number>(recovery?.energy_level || 3)
  const [restingHr, setRestingHr] = useState(heartRate?.resting_hr?.toString() || "")
  const [hrvScore, setHrvScore] = useState(recovery?.hrv_score?.toString() || "")

  const calculatedScore = calculateRecoveryScore({
    sleepHours: sleep?.hours_slept,
    sleepQuality: sleep?.quality_rating,
    hrvScore: hrvScore ? parseInt(hrvScore) : undefined,
    restingHr: restingHr ? parseInt(restingHr) : undefined,
    muscleSoreness,
    energyLevel,
  })

  const displayScore = recovery?.recovery_score ?? calculatedScore
  const recommendation = getRecoveryRecommendation(displayScore)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    if (restingHr) {
      await saveHeartRate({
        resting_hr: parseInt(restingHr),
      })
    }

    const success = await saveRecovery({
      recovery_score: calculatedScore,
      sleep_score: sleep ? Math.round((sleep.hours_slept || 7) / 8 * 100) : undefined,
      hrv_score: hrvScore ? parseInt(hrvScore) : undefined,
      muscle_soreness: muscleSoreness as 1 | 2 | 3 | 4 | 5,
      energy_level: energyLevel as 1 | 2 | 3 | 4 | 5,
    })

    setIsSubmitting(false)

    if (success) {
      setShowForm(false)
      onSuccess?.()
    }
  }

  const sorenessLabels = ["None", "Light", "Moderate", "Sore", "Very Sore"]
  const energyLabels = ["Very Low", "Low", "Moderate", "High", "Very High"]

  // SVG animation values
  const circumference = 2 * Math.PI * 56
  const strokeDasharray = (displayScore / 100) * circumference

  if (isLoading) {
    return (
      <GlassCard className={cn("p-6", className)}>
        <div className="space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-32 w-32 rounded-full mx-auto" />
          <Skeleton className="h-4 w-48 mx-auto" />
        </div>
      </GlassCard>
    )
  }

  return (
    <GlassCard className={cn("p-6", className)}>
      {/* Header */}
      <motion.div
        className="flex items-center justify-between mb-6"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-3">
          <motion.div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl",
              recommendation.status === "excellent" ? "bg-green-500/10" :
              recommendation.status === "good" ? "bg-primary/10" :
              recommendation.status === "moderate" ? "bg-amber-500/10" : "bg-red-500/10"
            )}
            whileHover={{ scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Heart className={cn(
              "h-5 w-5",
              recommendation.status === "excellent" ? "text-green-500" :
              recommendation.status === "good" ? "text-primary" :
              recommendation.status === "moderate" ? "text-amber-500" : "text-red-500"
            )} />
          </motion.div>
          <div>
            <h2 className="font-semibold">Recovery Score</h2>
            <p className="text-sm text-muted-foreground capitalize">{recommendation.status}</p>
          </div>
        </div>

        {!showForm && (
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowForm(true)}
            >
              Update
            </Button>
          </motion.div>
        )}
      </motion.div>

      {/* Score Display */}
      <motion.div
        className="flex flex-col items-center mb-6"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="relative w-32 h-32">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke="currentColor"
              strokeWidth="12"
              className="text-secondary"
            />
            <motion.circle
              cx="64"
              cy="64"
              r="56"
              fill="none"
              stroke="currentColor"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: circumference - strokeDasharray }}
              transition={{ duration: 1, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className={cn(
                recommendation.status === "excellent" ? "text-green-500" :
                recommendation.status === "good" ? "text-primary" :
                recommendation.status === "moderate" ? "text-amber-500" : "text-red-500"
              )}
            />
          </svg>
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <motion.span
              className="text-4xl font-bold"
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.6, type: "spring", stiffness: 300, damping: 20 }}
            >
              {displayScore}
            </motion.span>
          </motion.div>
        </div>
        <motion.p
          className={cn("mt-4 text-sm text-center max-w-xs", recommendation.color)}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          {recommendation.message}
        </motion.p>
      </motion.div>

      {/* Metrics Breakdown */}
      <AnimatePresence mode="wait">
        {!showForm && (
          <motion.div
            key="metrics"
            className="grid grid-cols-2 gap-3 mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {[
              { icon: Moon, label: "Sleep", value: sleep?.hours_slept ? `${sleep.hours_slept}h` : "Not logged" },
              { icon: Heart, label: "Resting HR", value: heartRate?.resting_hr ? `${heartRate.resting_hr} bpm` : "Not logged" },
              { icon: Activity, label: "Soreness", value: recovery?.muscle_soreness ? sorenessLabels[recovery.muscle_soreness - 1] : "Not logged" },
              { icon: Zap, label: "Energy", value: recovery?.energy_level ? energyLabels[recovery.energy_level - 1] : "Not logged" },
            ].map((metric, index) => (
              <motion.div
                key={metric.label}
                className="p-3 rounded-lg bg-secondary/30"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <metric.icon className="h-4 w-4" />
                  <span className="text-xs">{metric.label}</span>
                </div>
                <p className="font-medium">{metric.value}</p>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Form */}
      <AnimatePresence mode="wait">
        {showForm && (
          <motion.form
            key="form"
            onSubmit={handleSubmit}
            className="space-y-4"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Muscle Soreness */}
            <div className="space-y-2">
              <Label>Muscle Soreness</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((level) => (
                  <motion.button
                    key={level}
                    type="button"
                    onClick={() => setMuscleSoreness(level)}
                    className={cn(
                      "flex-1 p-2 rounded-lg text-center transition-colors",
                      muscleSoreness === level
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary/50 hover:bg-secondary"
                    )}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <span className="text-lg">{level}</span>
                    <span className="block text-[10px]">{sorenessLabels[level - 1]}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Energy Level */}
            <div className="space-y-2">
              <Label>Energy Level</Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((level) => (
                  <motion.button
                    key={level}
                    type="button"
                    onClick={() => setEnergyLevel(level)}
                    className={cn(
                      "flex-1 p-2 rounded-lg text-center transition-colors",
                      energyLevel === level
                        ? "bg-amber-500 text-white"
                        : "bg-secondary/50 hover:bg-secondary"
                    )}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Zap className={cn(
                      "h-4 w-4 mx-auto mb-1",
                      level <= energyLevel ? "fill-current" : ""
                    )} />
                    <span className="block text-[10px]">{energyLabels[level - 1]}</span>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Optional Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="restingHr">Resting HR (bpm)</Label>
                <Input
                  id="restingHr"
                  type="number"
                  placeholder="e.g., 58"
                  value={restingHr}
                  onChange={(e) => setRestingHr(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hrvScore">HRV (ms)</Label>
                <Input
                  id="hrvScore"
                  type="number"
                  placeholder="e.g., 65"
                  value={hrvScore}
                  onChange={(e) => setHrvScore(e.target.value)}
                />
              </div>
            </div>

            {/* Calculated Score Preview */}
            <motion.div
              className="flex items-center justify-between p-3 rounded-lg bg-secondary/30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <span className="text-sm text-muted-foreground">Calculated Score</span>
              <motion.span
                className={cn("text-xl font-bold", recommendation.color)}
                key={calculatedScore}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                {calculatedScore}
              </motion.span>
            </motion.div>

            {/* Actions */}
            <div className="flex gap-3">
              <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowForm(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </motion.div>
              <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      Save Score
                    </>
                  )}
                </Button>
              </motion.div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Info Note */}
      <motion.div
        className="mt-4 p-3 rounded-lg bg-secondary/20 flex gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          Recovery score is calculated from sleep, heart rate, muscle soreness, and energy levels.
          Log your sleep first for the most accurate score.
        </p>
      </motion.div>
    </GlassCard>
  )
}
