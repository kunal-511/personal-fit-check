"use client"

import { useState, useEffect } from "react"
import {
  Play,
  Pause,
  Square,
  MapPin,
  Timer,
  Flame,
  Heart,
  Activity,
  Footprints,
  Bike,
  Waves,
  Mountain
} from "lucide-react"
import { GlassCard } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type CardioType = "running" | "cycling" | "swimming" | "rowing" | "walking" | "hiking" | "elliptical"

interface CardioLoggerProps {
  onSave?: (data: CardioSessionData) => void
  onCancel?: () => void
  className?: string
}

interface CardioSessionData {
  type: CardioType
  duration: number // seconds
  distance?: number // km
  calories?: number
  avgHeartRate?: number
  maxHeartRate?: number
  notes?: string
}

const cardioTypes: { type: CardioType; label: string; icon: typeof Footprints; color: string }[] = [
  { type: "running", label: "Running", icon: Footprints, color: "text-orange-500" },
  { type: "cycling", label: "Cycling", icon: Bike, color: "text-blue-500" },
  { type: "swimming", label: "Swimming", icon: Waves, color: "text-cyan-500" },
  { type: "rowing", label: "Rowing", icon: Activity, color: "text-purple-500" },
  { type: "walking", label: "Walking", icon: Footprints, color: "text-green-500" },
  { type: "hiking", label: "Hiking", icon: Mountain, color: "text-amber-500" },
]

export function CardioLogger({ onSave, onCancel, className }: CardioLoggerProps) {
  const [selectedType, setSelectedType] = useState<CardioType>("running")
  const [isActive, setIsActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [distance, setDistance] = useState("")
  const [calories, setCalories] = useState("")
  const [avgHeartRate, setAvgHeartRate] = useState("")
  const [maxHeartRate, setMaxHeartRate] = useState("")
  const [notes, setNotes] = useState("")

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isActive && !isPaused) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1)
      }, 1000)
    }

    return () => clearInterval(interval)
  }, [isActive, isPaused])

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const calculatePace = () => {
    if (!distance || parseFloat(distance) === 0 || elapsedTime === 0) return null
    const paceSeconds = elapsedTime / parseFloat(distance)
    const paceMin = Math.floor(paceSeconds / 60)
    const paceSec = Math.round(paceSeconds % 60)
    return `${paceMin}:${paceSec.toString().padStart(2, "0")} /km`
  }

  const estimateCalories = () => {
    // Simple estimation based on MET values
    const metValues: Record<CardioType, number> = {
      running: 9.8,
      cycling: 7.5,
      swimming: 8.0,
      rowing: 7.0,
      walking: 3.5,
      hiking: 6.0,
      elliptical: 5.0,
    }
    const met = metValues[selectedType]
    const hours = elapsedTime / 3600
    const weight = 70 // Assume 70kg, could be from user profile
    return Math.round(met * weight * hours)
  }

  const handleStart = () => {
    setIsActive(true)
    setIsPaused(false)
  }

  const handlePause = () => {
    setIsPaused(true)
  }

  const handleResume = () => {
    setIsPaused(false)
  }

  const handleStop = () => {
    setIsActive(false)
    setIsPaused(false)
  }

  const handleSave = () => {
    const data: CardioSessionData = {
      type: selectedType,
      duration: elapsedTime,
      distance: distance ? parseFloat(distance) : undefined,
      calories: calories ? parseInt(calories) : estimateCalories(),
      avgHeartRate: avgHeartRate ? parseInt(avgHeartRate) : undefined,
      maxHeartRate: maxHeartRate ? parseInt(maxHeartRate) : undefined,
      notes: notes || undefined,
    }
    onSave?.(data)
  }

  const handleReset = () => {
    setIsActive(false)
    setIsPaused(false)
    setElapsedTime(0)
    setDistance("")
    setCalories("")
    setAvgHeartRate("")
    setMaxHeartRate("")
    setNotes("")
  }

  const selectedTypeData = cardioTypes.find((t) => t.type === selectedType)!

  return (
    <GlassCard className={cn("p-6", className)}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className={cn(
          "flex h-12 w-12 items-center justify-center rounded-xl",
          "bg-gradient-to-br from-orange-500/20 to-red-500/20"
        )}>
          <Activity className="h-6 w-6 text-orange-500" />
        </div>
        <div>
          <h2 className="font-semibold">Cardio Session</h2>
          <p className="text-sm text-muted-foreground">Track your cardio workout</p>
        </div>
      </div>

      {/* Cardio Type Selection */}
      {!isActive && (
        <div className="mb-6">
          <Label className="mb-3 block">Activity Type</Label>
          <div className="grid grid-cols-3 gap-2">
            {cardioTypes.map(({ type, label, icon: Icon, color }) => (
              <Button
                key={type}
                variant={selectedType === type ? "default" : "outline"}
                className={cn(
                  "flex flex-col h-auto py-3 gap-1",
                  selectedType === type && "ring-2 ring-offset-2 ring-offset-background ring-primary"
                )}
                onClick={() => setSelectedType(type)}
              >
                <Icon className={cn("h-5 w-5", selectedType !== type && color)} />
                <span className="text-xs">{label}</span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Active Session Display */}
      {isActive && (
        <div className="mb-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <selectedTypeData.icon className={cn("h-6 w-6", selectedTypeData.color)} />
            <span className="text-lg font-medium">{selectedTypeData.label}</span>
          </div>
        </div>
      )}

      {/* Timer Display */}
      <div className="text-center mb-6">
        <div className={cn(
          "inline-flex flex-col items-center justify-center",
          "w-48 h-48 rounded-full",
          "bg-gradient-to-br from-primary/10 to-primary/5",
          "border-4",
          isActive && !isPaused ? "border-primary" : "border-border"
        )}>
          <Timer className={cn(
            "h-6 w-6 mb-2",
            isActive && !isPaused ? "text-primary" : "text-muted-foreground"
          )} />
          <span className="text-4xl font-mono font-bold tabular-nums">
            {formatTime(elapsedTime)}
          </span>
          <span className="text-sm text-muted-foreground mt-1">
            {isPaused ? "Paused" : isActive ? "Active" : "Ready"}
          </span>
        </div>
      </div>

      {/* Live Stats (when active) */}
      {isActive && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="text-center p-3 rounded-lg bg-secondary/50">
            <MapPin className="h-4 w-4 mx-auto mb-1 text-blue-500" />
            <p className="text-lg font-bold">{distance || "0"}</p>
            <p className="text-xs text-muted-foreground">km</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-secondary/50">
            <Flame className="h-4 w-4 mx-auto mb-1 text-orange-500" />
            <p className="text-lg font-bold">{calories || estimateCalories()}</p>
            <p className="text-xs text-muted-foreground">cal</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-secondary/50">
            <Activity className="h-4 w-4 mx-auto mb-1 text-primary" />
            <p className="text-lg font-bold">{calculatePace() || "--:--"}</p>
            <p className="text-xs text-muted-foreground">pace</p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 mb-6">
        {!isActive ? (
          <Button
            size="lg"
            className="h-14 px-8 rounded-full"
            onClick={handleStart}
          >
            <Play className="h-5 w-5 mr-2" />
            Start Session
          </Button>
        ) : (
          <>
            {isPaused ? (
              <Button
                size="lg"
                className="h-14 w-14 rounded-full"
                onClick={handleResume}
              >
                <Play className="h-6 w-6" />
              </Button>
            ) : (
              <Button
                size="lg"
                variant="secondary"
                className="h-14 w-14 rounded-full"
                onClick={handlePause}
              >
                <Pause className="h-6 w-6" />
              </Button>
            )}
            <Button
              size="lg"
              variant="destructive"
              className="h-14 w-14 rounded-full"
              onClick={handleStop}
            >
              <Square className="h-5 w-5" />
            </Button>
          </>
        )}
      </div>

      {/* Manual Input Fields */}
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="distance" className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-blue-500" />
              Distance (km)
            </Label>
            <Input
              id="distance"
              type="number"
              step="0.1"
              placeholder="0.0"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="calories" className="flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              Calories
            </Label>
            <Input
              id="calories"
              type="number"
              placeholder={estimateCalories().toString()}
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="avgHr" className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-red-500" />
              Avg Heart Rate
            </Label>
            <Input
              id="avgHr"
              type="number"
              placeholder="bpm"
              value={avgHeartRate}
              onChange={(e) => setAvgHeartRate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxHr" className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-red-500" />
              Max Heart Rate
            </Label>
            <Input
              id="maxHr"
              type="number"
              placeholder="bpm"
              value={maxHeartRate}
              onChange={(e) => setMaxHeartRate(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Input
            id="notes"
            placeholder="How did it feel?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mt-6">
        <Button variant="outline" className="flex-1" onClick={onCancel || handleReset}>
          Cancel
        </Button>
        <Button
          className="flex-1"
          onClick={handleSave}
          disabled={elapsedTime === 0}
        >
          Save Session
        </Button>
      </div>
    </GlassCard>
  )
}
