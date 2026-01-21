"use client"

import { useState, useEffect, useCallback } from "react"
import { Play, Pause, RotateCcw, Plus, Minus, SkipForward, Volume2, VolumeX, Check } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { GlassCard } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface RestTimerProps {
  initialSeconds?: number
  onComplete?: () => void
  onSkip?: () => void
  autoStart?: boolean
  showPresets?: boolean
  className?: string
}

const presets = [
  { label: "30s", seconds: 30, description: "Light sets" },
  { label: "60s", seconds: 60, description: "Moderate" },
  { label: "90s", seconds: 90, description: "Heavy sets" },
  { label: "2m", seconds: 120, description: "Compound" },
  { label: "3m", seconds: 180, description: "Max effort" },
  { label: "5m", seconds: 300, description: "Powerlifting" },
]

export function RestTimer({
  initialSeconds = 90,
  onComplete,
  onSkip,
  autoStart = false,
  showPresets = true,
  className,
}: RestTimerProps) {
  const [totalSeconds, setTotalSeconds] = useState(initialSeconds)
  const [remainingSeconds, setRemainingSeconds] = useState(initialSeconds)
  const [isRunning, setIsRunning] = useState(autoStart)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [showComplete, setShowComplete] = useState(false)

  const progress = ((totalSeconds - remainingSeconds) / totalSeconds) * 100
  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = remainingSeconds % 60

  // Play sound when timer completes
  const playSound = useCallback(() => {
    if (soundEnabled && typeof window !== "undefined") {
      try {
        const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        oscillator.frequency.value = 800
        oscillator.type = "sine"
        gainNode.gain.value = 0.3

        oscillator.start()
        setTimeout(() => {
          oscillator.stop()
          audioContext.close()
        }, 200)

        setTimeout(() => {
          const ctx2 = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
          const osc2 = ctx2.createOscillator()
          const gain2 = ctx2.createGain()
          osc2.connect(gain2)
          gain2.connect(ctx2.destination)
          osc2.frequency.value = 800
          gain2.gain.value = 0.3
          osc2.start()
          setTimeout(() => { osc2.stop(); ctx2.close() }, 200)
        }, 300)

        setTimeout(() => {
          const ctx3 = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
          const osc3 = ctx3.createOscillator()
          const gain3 = ctx3.createGain()
          osc3.connect(gain3)
          gain3.connect(ctx3.destination)
          osc3.frequency.value = 1000
          gain3.gain.value = 0.3
          osc3.start()
          setTimeout(() => { osc3.stop(); ctx3.close() }, 400)
        }, 600)
      } catch {
        // Audio not supported
      }
    }
  }, [soundEnabled])

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isRunning && remainingSeconds > 0) {
      interval = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            setIsRunning(false)
            setShowComplete(true)
            playSound()
            onComplete?.()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => clearInterval(interval)
  }, [isRunning, remainingSeconds, onComplete, playSound])

  const handleStart = () => {
    setShowComplete(false)
    setIsRunning(true)
  }
  const handlePause = () => setIsRunning(false)
  const handleReset = () => {
    setIsRunning(false)
    setShowComplete(false)
    setRemainingSeconds(totalSeconds)
  }

  const handlePreset = (secs: number) => {
    setTotalSeconds(secs)
    setRemainingSeconds(secs)
    setIsRunning(false)
    setShowComplete(false)
  }

  const adjustTime = (delta: number) => {
    const newTime = Math.max(0, remainingSeconds + delta)
    setRemainingSeconds(newTime)
    if (newTime > totalSeconds) {
      setTotalSeconds(newTime)
    }
  }

  const handleSkip = () => {
    setIsRunning(false)
    setRemainingSeconds(0)
    onSkip?.()
  }

  // Circle dimensions
  const size = 200
  const strokeWidth = 12
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progress / 100) * circumference

  const isWarning = remainingSeconds <= 10 && remainingSeconds > 0

  return (
    <GlassCard className={cn("p-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Rest Timer</h3>
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>
        </motion.div>
      </div>

      {/* Circular Timer */}
      <div className="flex justify-center mb-6">
        <motion.div
          className="relative"
          style={{ width: size, height: size }}
          animate={showComplete ? {
            scale: [1, 1.05, 1],
            transition: { duration: 0.5 }
          } : {}}
        >
          {/* Background circle */}
          <svg className="absolute inset-0 -rotate-90" width={size} height={size}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              strokeWidth={strokeWidth}
              className="stroke-secondary"
            />
            {/* Progress circle */}
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className={cn(
                isWarning ? "stroke-amber-500" : "stroke-primary",
                showComplete && "stroke-primary"
              )}
            />
          </svg>

          {/* Pulse ring for warning */}
          <AnimatePresence>
            {isWarning && (
              <motion.div
                className="absolute inset-0 rounded-full border-4 border-amber-500"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: [0.5, 0, 0.5],
                  scale: [0.95, 1.05, 0.95],
                }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            )}
          </AnimatePresence>

          {/* Timer display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
              {showComplete ? (
                <motion.div
                  key="complete"
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="flex flex-col items-center"
                >
                  <motion.div
                    className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.2 }}
                  >
                    <Check className="h-8 w-8 text-primary" />
                  </motion.div>
                  <motion.span
                    className="text-sm text-primary font-medium"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    Rest Complete!
                  </motion.span>
                </motion.div>
              ) : (
                <motion.div
                  key="timer"
                  className="flex flex-col items-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.span
                    className={cn(
                      "text-5xl font-mono font-bold tabular-nums",
                      isWarning && "text-amber-500"
                    )}
                    animate={isWarning ? {
                      scale: [1, 1.05, 1],
                      transition: { duration: 0.5, repeat: Infinity }
                    } : {}}
                  >
                    {minutes.toString().padStart(2, "0")}:{seconds.toString().padStart(2, "0")}
                  </motion.span>
                  <span className="text-sm text-muted-foreground mt-1">
                    {isRunning ? "Resting..." : "Paused"}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* Time Adjustment */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full"
            onClick={() => adjustTime(-15)}
          >
            <Minus className="h-4 w-4" />
          </Button>
        </motion.div>
        <span className="text-sm text-muted-foreground w-16 text-center">
          {isRunning ? "-/+ 15s" : "Adjust"}
        </span>
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full"
            onClick={() => adjustTime(15)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </motion.div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 mb-6">
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-full"
            onClick={handleReset}
          >
            <RotateCcw className="h-5 w-5" />
          </Button>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            size="icon"
            className={cn(
              "h-16 w-16 rounded-full transition-colors duration-300",
              isRunning ? "bg-amber-500 hover:bg-amber-600" : "bg-primary hover:bg-primary/90"
            )}
            onClick={isRunning ? handlePause : handleStart}
          >
            <AnimatePresence mode="wait">
              {isRunning ? (
                <motion.div
                  key="pause"
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 90 }}
                  transition={{ duration: 0.2 }}
                >
                  <Pause className="h-6 w-6" />
                </motion.div>
              ) : (
                <motion.div
                  key="play"
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 90 }}
                  transition={{ duration: 0.2 }}
                >
                  <Play className="h-6 w-6 ml-1" />
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </motion.div>

        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <Button
            variant="outline"
            size="icon"
            className="h-12 w-12 rounded-full"
            onClick={handleSkip}
          >
            <SkipForward className="h-5 w-5" />
          </Button>
        </motion.div>
      </div>

      {/* Presets */}
      {showPresets && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-xs text-muted-foreground text-center mb-3">Quick Presets</p>
          <div className="grid grid-cols-3 gap-2">
            {presets.map((preset, index) => (
              <motion.div
                key={preset.seconds}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  variant={totalSeconds === preset.seconds ? "default" : "secondary"}
                  size="sm"
                  className="flex flex-col h-auto py-2 w-full"
                  onClick={() => handlePreset(preset.seconds)}
                >
                  <span className="font-medium">{preset.label}</span>
                  <span className="text-[10px] opacity-70">{preset.description}</span>
                </Button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </GlassCard>
  )
}
