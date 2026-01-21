"use client"

import * as React from "react"
import { motion, useInView } from "framer-motion"
import { cn } from "@/lib/utils"

interface ProgressProps extends React.ComponentProps<"div"> {
  value?: number
  max?: number
  indicatorClassName?: string
  animate?: boolean
  animationDelay?: number
}

function Progress({
  className,
  value = 0,
  max = 100,
  indicatorClassName,
  animate = false,
  animationDelay = 0,
  ...props
}: ProgressProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))
  const ref = React.useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })

  return (
    <div
      ref={ref}
      data-slot="progress"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
      {...props}
    >
      {animate ? (
        <motion.div
          data-slot="progress-indicator"
          className={cn("h-full bg-primary", indicatorClassName)}
          initial={{ width: "0%" }}
          animate={isInView ? { width: `${percentage}%` } : { width: "0%" }}
          transition={{
            duration: 0.8,
            delay: animationDelay,
            ease: [0.4, 0, 0.2, 1],
          }}
        />
      ) : (
        <div
          data-slot="progress-indicator"
          className={cn(
            "h-full bg-primary transition-all duration-300 ease-out",
            indicatorClassName
          )}
          style={{ width: `${percentage}%` }}
        />
      )}
    </div>
  )
}

// Circular progress for macro rings with animation support
interface CircularProgressProps {
  value: number
  max: number
  size?: number
  strokeWidth?: number
  className?: string
  trackClassName?: string
  indicatorClassName?: string
  children?: React.ReactNode
  animate?: boolean
  animationDelay?: number
}

function CircularProgress({
  value,
  max,
  size = 120,
  strokeWidth = 8,
  className,
  trackClassName,
  indicatorClassName,
  children,
  animate = false,
  animationDelay = 0,
}: CircularProgressProps) {
  // Guard against NaN when max is 0 or invalid
  const safeMax = max > 0 ? max : 1
  const safeValue = Number.isFinite(value) ? value : 0
  const percentage = Math.min(100, Math.max(0, (safeValue / safeMax) * 100))
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (percentage / 100) * circumference

  const ref = React.useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-50px" })

  return (
    <div
      ref={ref}
      className={cn("relative inline-flex items-center justify-center", className)}
    >
      <svg width={size} height={size} className="-rotate-90">
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className={cn("stroke-secondary", trackClassName)}
        />
        {/* Indicator */}
        {animate ? (
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={isInView ? { strokeDashoffset: offset } : { strokeDashoffset: circumference }}
            transition={{
              duration: 1,
              delay: animationDelay + 0.3,
              ease: [0.4, 0, 0.2, 1],
            }}
            className={cn("stroke-primary", indicatorClassName)}
          />
        ) : (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={cn(
              "stroke-primary transition-all duration-500 ease-out",
              indicatorClassName
            )}
          />
        )}
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  )
}

export { Progress, CircularProgress }
