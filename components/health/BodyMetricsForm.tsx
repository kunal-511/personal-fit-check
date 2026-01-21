"use client"

import { useState } from "react"
import { Scale, Ruler, Check, Loader2 } from "lucide-react"
import { GlassCard } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useHealthStore } from "@/lib/health-store"
import { cn } from "@/lib/utils"

interface BodyMetricsFormProps {
  initialData?: {
    weight_kg?: number
    body_fat_percent?: number
    chest_cm?: number
    waist_cm?: number
    hips_cm?: number
    left_arm_cm?: number
    right_arm_cm?: number
    left_thigh_cm?: number
    right_thigh_cm?: number
    notes?: string
  }
  onSuccess?: () => void
  onCancel?: () => void
  className?: string
}

export function BodyMetricsForm({
  initialData,
  onSuccess,
  onCancel,
  className,
}: BodyMetricsFormProps) {
  const { saveBodyMetrics } = useHealthStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showMeasurements, setShowMeasurements] = useState(false)

  // Form state
  const [weight, setWeight] = useState(initialData?.weight_kg?.toString() || "")
  const [bodyFat, setBodyFat] = useState(initialData?.body_fat_percent?.toString() || "")
  const [chest, setChest] = useState(initialData?.chest_cm?.toString() || "")
  const [waist, setWaist] = useState(initialData?.waist_cm?.toString() || "")
  const [hips, setHips] = useState(initialData?.hips_cm?.toString() || "")
  const [leftArm, setLeftArm] = useState(initialData?.left_arm_cm?.toString() || "")
  const [rightArm, setRightArm] = useState(initialData?.right_arm_cm?.toString() || "")
  const [leftThigh, setLeftThigh] = useState(initialData?.left_thigh_cm?.toString() || "")
  const [rightThigh, setRightThigh] = useState(initialData?.right_thigh_cm?.toString() || "")
  const [notes, setNotes] = useState(initialData?.notes || "")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const data = {
      weight_kg: weight ? parseFloat(weight) : undefined,
      body_fat_percent: bodyFat ? parseFloat(bodyFat) : undefined,
      chest_cm: chest ? parseFloat(chest) : undefined,
      waist_cm: waist ? parseFloat(waist) : undefined,
      hips_cm: hips ? parseFloat(hips) : undefined,
      left_arm_cm: leftArm ? parseFloat(leftArm) : undefined,
      right_arm_cm: rightArm ? parseFloat(rightArm) : undefined,
      left_thigh_cm: leftThigh ? parseFloat(leftThigh) : undefined,
      right_thigh_cm: rightThigh ? parseFloat(rightThigh) : undefined,
      notes: notes || undefined,
    }

    const success = await saveBodyMetrics(data)
    setIsSubmitting(false)

    if (success) {
      onSuccess?.()
    }
  }

  const hasBasicData = weight || bodyFat
  const hasMeasurements = chest || waist || hips || leftArm || rightArm || leftThigh || rightThigh

  return (
    <GlassCard className={cn("p-6", className)}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Scale className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-semibold">Log Body Metrics</h2>
            <p className="text-sm text-muted-foreground">Track your progress</p>
          </div>
        </div>

        {/* Basic Metrics */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="weight">Weight (kg)</Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              placeholder="e.g., 75.5"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bodyFat">Body Fat (%)</Label>
            <Input
              id="bodyFat"
              type="number"
              step="0.1"
              placeholder="e.g., 18.5"
              value={bodyFat}
              onChange={(e) => setBodyFat(e.target.value)}
            />
          </div>
        </div>

        {/* Toggle Measurements */}
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => setShowMeasurements(!showMeasurements)}
        >
          <Ruler className="mr-2 h-4 w-4" />
          {showMeasurements ? "Hide" : "Add"} Body Measurements
        </Button>

        {/* Body Measurements */}
        {showMeasurements && (
          <div className="space-y-4 p-4 rounded-lg bg-secondary/30">
            <h3 className="text-sm font-medium text-muted-foreground">Body Measurements (cm)</h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="chest">Chest</Label>
                <Input
                  id="chest"
                  type="number"
                  step="0.5"
                  placeholder="e.g., 100"
                  value={chest}
                  onChange={(e) => setChest(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="waist">Waist</Label>
                <Input
                  id="waist"
                  type="number"
                  step="0.5"
                  placeholder="e.g., 82"
                  value={waist}
                  onChange={(e) => setWaist(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hips">Hips</Label>
                <Input
                  id="hips"
                  type="number"
                  step="0.5"
                  placeholder="e.g., 95"
                  value={hips}
                  onChange={(e) => setHips(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="leftArm">Left Arm</Label>
                <Input
                  id="leftArm"
                  type="number"
                  step="0.5"
                  placeholder="e.g., 35"
                  value={leftArm}
                  onChange={(e) => setLeftArm(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rightArm">Right Arm</Label>
                <Input
                  id="rightArm"
                  type="number"
                  step="0.5"
                  placeholder="e.g., 35"
                  value={rightArm}
                  onChange={(e) => setRightArm(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="leftThigh">Left Thigh</Label>
                <Input
                  id="leftThigh"
                  type="number"
                  step="0.5"
                  placeholder="e.g., 55"
                  value={leftThigh}
                  onChange={(e) => setLeftThigh(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rightThigh">Right Thigh</Label>
                <Input
                  id="rightThigh"
                  type="number"
                  step="0.5"
                  placeholder="e.g., 55"
                  value={rightThigh}
                  onChange={(e) => setRightThigh(e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Input
            id="notes"
            placeholder="Any notes about today's measurement..."
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
            disabled={isSubmitting || (!hasBasicData && !hasMeasurements)}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Save Metrics
              </>
            )}
          </Button>
        </div>
      </form>
    </GlassCard>
  )
}
