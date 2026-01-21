"use client"

import { Info } from "lucide-react"
import { GlassCard } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface Micronutrient {
  name: string
  current: number
  target: number
  unit: string
  category: "vitamin" | "mineral"
}

interface MicronutrientTrackerProps {
  data?: Micronutrient[]
  className?: string
}

const defaultMicronutrients: Micronutrient[] = [
  // Vitamins
  { name: "Vitamin C", current: 65, target: 90, unit: "mg", category: "vitamin" },
  { name: "Vitamin D", current: 12, target: 20, unit: "mcg", category: "vitamin" },
  { name: "Vitamin B12", current: 1.8, target: 2.4, unit: "mcg", category: "vitamin" },
  { name: "Vitamin A", current: 650, target: 900, unit: "mcg", category: "vitamin" },
  { name: "Vitamin E", current: 10, target: 15, unit: "mg", category: "vitamin" },
  { name: "Vitamin K", current: 85, target: 120, unit: "mcg", category: "vitamin" },
  // Minerals
  { name: "Calcium", current: 850, target: 1000, unit: "mg", category: "mineral" },
  { name: "Iron", current: 12, target: 18, unit: "mg", category: "mineral" },
  { name: "Magnesium", current: 320, target: 400, unit: "mg", category: "mineral" },
  { name: "Zinc", current: 8, target: 11, unit: "mg", category: "mineral" },
  { name: "Potassium", current: 3200, target: 4700, unit: "mg", category: "mineral" },
  { name: "Sodium", current: 1800, target: 2300, unit: "mg", category: "mineral" },
]

function getStatusColor(percentage: number): string {
  if (percentage >= 100) return "bg-primary"
  if (percentage >= 75) return "bg-emerald-500"
  if (percentage >= 50) return "bg-amber-500"
  return "bg-red-500"
}

function getStatusText(percentage: number): string {
  if (percentage >= 100) return "Met"
  if (percentage >= 75) return "Good"
  if (percentage >= 50) return "Low"
  return "Deficient"
}

function getStatusTextColor(percentage: number): string {
  if (percentage >= 100) return "text-primary"
  if (percentage >= 75) return "text-emerald-500"
  if (percentage >= 50) return "text-amber-500"
  return "text-red-500"
}

export function MicronutrientTracker({
  data = defaultMicronutrients,
  className,
}: MicronutrientTrackerProps) {
  const vitamins = data.filter((n) => n.category === "vitamin")
  const minerals = data.filter((n) => n.category === "mineral")

  const NutrientBar = ({ nutrient }: { nutrient: Micronutrient }) => {
    const percentage = Math.min(100, Math.round((nutrient.current / nutrient.target) * 100))

    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{nutrient.name}</span>
          <span className="flex items-center gap-2">
            <span className="font-medium">
              {nutrient.current}{nutrient.unit}
            </span>
            <span className={cn("text-xs", getStatusTextColor(percentage))}>
              {getStatusText(percentage)}
            </span>
          </span>
        </div>
        <Progress
          value={percentage}
          className="h-2"
          indicatorClassName={getStatusColor(percentage)}
        />
      </div>
    )
  }

  // Calculate overall status
  const overallPercentage = Math.round(
    data.reduce((acc, n) => acc + Math.min(100, (n.current / n.target) * 100), 0) / data.length
  )

  return (
    <GlassCard className={cn("p-6", className)}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">Micronutrients</h2>
        <div className="flex items-center gap-2">
          <span className={cn("text-sm font-medium", getStatusTextColor(overallPercentage))}>
            {overallPercentage}% overall
          </span>
          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-primary" />
          <span className="text-muted-foreground">Met (100%+)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-muted-foreground">Good (75-99%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-amber-500" />
          <span className="text-muted-foreground">Low (50-74%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-red-500" />
          <span className="text-muted-foreground">Deficient (&lt;50%)</span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Vitamins */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Vitamins</h3>
          <div className="space-y-3">
            {vitamins.map((nutrient) => (
              <NutrientBar key={nutrient.name} nutrient={nutrient} />
            ))}
          </div>
        </div>

        {/* Minerals */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Minerals</h3>
          <div className="space-y-3">
            {minerals.map((nutrient) => (
              <NutrientBar key={nutrient.name} nutrient={nutrient} />
            ))}
          </div>
        </div>
      </div>

      <p className="mt-4 text-xs text-muted-foreground text-center">
        Based on recommended daily values for adults
      </p>
    </GlassCard>
  )
}
