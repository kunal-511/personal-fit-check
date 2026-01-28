"use client"

import { useState } from "react"
import { Moon, Sun, Clock, Star, Loader2, Check } from "lucide-react"
import { GlassCard } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useHealthStore } from "@/lib/health-store"
import { cn } from "@/lib/utils"

interface SleepLoggerProps {
  initialData?: {
    bedtime?: string
    wake_time?: string
    hours_slept?: number
    quality_rating?: number
    notes?: string
  }
  onSuccess?: () => void
  onCancel?: () => void
  className?: string
}

export function SleepLogger({
  initialData,
  onSuccess,
  onCancel,
  className,
}: SleepLoggerProps) {
  const { saveSleep } = useHealthStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form state
  const [bedtime, setBedtime] = useState(initialData?.bedtime || "")
  const [wakeTime, setWakeTime] = useState(initialData?.wake_time || "")
  const [quality, setQuality] = useState(initialData?.quality_rating || 0)
  const [notes, setNotes] = useState(initialData?.notes || "")

  // Calculate hours slept
  const calculateHours = (): number | null => {
    if (!bedtime || !wakeTime) return null

    const [bedHour, bedMin] = bedtime.split(":").map(Number)
    const [wakeHour, wakeMin] = wakeTime.split(":").map(Number)

    const bedMinutes = bedHour * 60 + bedMin
    let wakeMinutes = wakeHour * 60 + wakeMin

    // Handle overnight sleep
    if (wakeMinutes < bedMinutes) {
      wakeMinutes += 24 * 60
    }

    return Math.round((wakeMinutes - bedMinutes) / 60 * 10) / 10
  }

  const hoursSlept = calculateHours()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const data = {
      bedtime: bedtime || undefined,
      wake_time: wakeTime || undefined,
      hours_slept: hoursSlept || undefined,
      quality_rating: quality > 0 ? (quality as 1 | 2 | 3 | 4 | 5) : undefined,
      notes: notes || undefined,
    }

    const success = await saveSleep(data)
    setIsSubmitting(false)

    if (success) {
      onSuccess?.()
    }
  }

  const qualityLabels = ["", "Poor", "Fair", "Okay", "Good", "Excellent"]
  const qualityColors = ["", "text-red-500", "text-orange-500", "text-amber-500", "text-lime-500", "text-green-500"]

  return (
    <GlassCard className={cn("p-6", className)}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
            <Moon className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h2 className="font-semibold">Log Sleep</h2>
            <p className="text-sm text-muted-foreground">Track your rest</p>
          </div>
        </div>

        {/* Time Inputs */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="bedtime" className="flex items-center gap-2">
              <Moon className="h-4 w-4 text-blue-500" />
              Bedtime
            </Label>
            <Input
              id="bedtime"
              type="time"
              value={bedtime}
              onChange={(e) => setBedtime(e.target.value)}
              className="text-lg"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="wakeTime" className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-amber-500" />
              Wake Time
            </Label>
            <Input
              id="wakeTime"
              type="time"
              value={wakeTime}
              onChange={(e) => setWakeTime(e.target.value)}
              className="text-lg"
            />
          </div>
        </div>

        {/* Calculated Hours */}
        {hoursSlept !== null && (
          <div className="flex items-center justify-center p-4 rounded-lg bg-blue-500/10">
            <Clock className="h-5 w-5 text-blue-500 mr-2" />
            <span className="text-lg">
              <span className="font-bold text-2xl">{hoursSlept}</span> hours of sleep
            </span>
          </div>
        )}

        {/* Quality Rating */}
        <div className="space-y-3">
          <Label>Sleep Quality</Label>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => setQuality(rating)}
                className={cn(
                  "flex flex-col items-center gap-1 p-3 rounded-lg transition-all",
                  quality === rating
                    ? "bg-blue-500/20 ring-2 ring-blue-500"
                    : "bg-secondary/50 hover:bg-secondary"
                )}
              >
                <Star
                  className={cn(
                    "h-6 w-6 transition-colors",
                    rating <= quality
                      ? "text-blue-500 fill-blue-500"
                      : "text-muted-foreground"
                  )}
                />
                <span className={cn(
                  "text-xs",
                  quality === rating ? qualityColors[rating] : "text-muted-foreground"
                )}>
                  {qualityLabels[rating]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Input
            id="notes"
            placeholder="How did you sleep? Any dreams?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            className="flex-1"
            disabled={isSubmitting || !hoursSlept}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Log Sleep
              </>
            )}
          </Button>
        </div>
      </form>
    </GlassCard>
  )
}
