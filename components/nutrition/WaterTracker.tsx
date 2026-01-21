"use client"

import { useState } from "react"
import { Droplets, Plus, Minus } from "lucide-react"
import { GlassCard } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

interface WaterTrackerProps {
  current: number
  target: number
  onAdd?: (amount: number) => void
}

const quickAmounts = [250, 500, 750, 1000]

export function WaterTracker({ current, target, onAdd }: WaterTrackerProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [customAmount, setCustomAmount] = useState(250)

  const percentage = Math.min(100, Math.round((current / target) * 100))
  const remaining = Math.max(0, target - current)

  const handleQuickAdd = (amount: number) => {
    onAdd?.(amount)
  }

  const handleCustomAdd = () => {
    onAdd?.(customAmount)
    setDialogOpen(false)
  }

  // Calculate water glass fill level (8 glasses = target)
  const glassCount = 8
  const filledGlasses = Math.floor((current / target) * glassCount)
  const partialFill = ((current / target) * glassCount) % 1

  return (
    <>
      <GlassCard className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
              <Droplets className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="font-medium">Water Intake</p>
              <p className="text-sm text-muted-foreground">
                {(current / 1000).toFixed(1)}L / {(target / 1000).toFixed(1)}L
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />
            Add
          </Button>
        </div>

        {/* Progress bar */}
        <Progress
          value={percentage}
          className="h-3 mb-4"
          indicatorClassName="bg-blue-500"
        />

        {/* Visual glasses */}
        <div className="flex justify-between gap-1 mb-3">
          {Array.from({ length: glassCount }).map((_, i) => {
            const isFilled = i < filledGlasses
            const isPartial = i === filledGlasses && partialFill > 0

            return (
              <div
                key={i}
                className="relative flex-1 h-8 rounded-md bg-secondary overflow-hidden"
              >
                <div
                  className={cn(
                    "absolute bottom-0 left-0 right-0 bg-blue-500/80 transition-all duration-300",
                    isFilled && "h-full",
                    isPartial && `h-[${Math.round(partialFill * 100)}%]`
                  )}
                  style={{
                    height: isFilled ? "100%" : isPartial ? `${Math.round(partialFill * 100)}%` : "0%"
                  }}
                />
              </div>
            )
          })}
        </div>

        {/* Quick add buttons */}
        <div className="flex gap-2">
          {quickAmounts.map((amount) => (
            <Button
              key={amount}
              variant="secondary"
              size="sm"
              className="flex-1 text-xs"
              onClick={() => handleQuickAdd(amount)}
            >
              +{amount >= 1000 ? `${amount / 1000}L` : `${amount}ml`}
            </Button>
          ))}
        </div>

        {/* Remaining text */}
        <p className="text-center text-xs text-muted-foreground mt-3">
          {remaining > 0
            ? `${(remaining / 1000).toFixed(1)}L remaining to reach your goal`
            : "Goal reached! Great job staying hydrated!"
          }
        </p>
      </GlassCard>

      {/* Custom Add Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-blue-500" />
              Add Water
            </DialogTitle>
            <DialogDescription>
              Track your water intake to stay hydrated
            </DialogDescription>
          </DialogHeader>

          <div className="py-6">
            {/* Amount selector */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={() => setCustomAmount(Math.max(50, customAmount - 50))}
              >
                <Minus className="h-5 w-5" />
              </Button>

              <div className="text-center min-w-[120px]">
                <p className="text-4xl font-bold text-blue-500">{customAmount}</p>
                <p className="text-sm text-muted-foreground">ml</p>
              </div>

              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={() => setCustomAmount(customAmount + 50)}
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>

            {/* Quick presets */}
            <div className="grid grid-cols-4 gap-2">
              {[100, 200, 250, 330, 500, 750, 1000, 1500].map((amount) => (
                <Button
                  key={amount}
                  variant={customAmount === amount ? "default" : "secondary"}
                  size="sm"
                  className="text-xs"
                  onClick={() => setCustomAmount(amount)}
                >
                  {amount >= 1000 ? `${amount / 1000}L` : `${amount}ml`}
                </Button>
              ))}
            </div>

            {/* Visual representation */}
            <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="h-4 w-4 rounded bg-blue-500/20" />
                <span>
                  {customAmount <= 250 && "Small glass"}
                  {customAmount > 250 && customAmount <= 500 && "Regular glass"}
                  {customAmount > 500 && customAmount <= 750 && "Large glass"}
                  {customAmount > 750 && "Bottle"}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCustomAdd} className="bg-blue-500 hover:bg-blue-600">
              <Plus className="mr-2 h-4 w-4" />
              Add {customAmount}ml
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
