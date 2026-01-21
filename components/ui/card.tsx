"use client"

import * as React from "react"
import { motion, type HTMLMotionProps } from "framer-motion"
import { cn } from "@/lib/utils"

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border border-border/50 py-6 shadow-sm",
        className
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex flex-col gap-1.5 px-6", className)}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6", className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center px-6", className)}
      {...props}
    />
  )
}

// Glass variant for the fitness tracker design with optional hover animation
interface GlassCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children?: React.ReactNode
  hover?: boolean
}

function GlassCard({ className, hover = false, children, ...props }: GlassCardProps) {
  if (hover) {
    return (
      <motion.div
        data-slot="glass-card"
        className={cn(
          "bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl",
          "transition-colors duration-300",
          className
        )}
        whileHover={{
          scale: 1.02,
          y: -4,
          backgroundColor: "rgba(255, 255, 255, 0.07)",
        }}
        whileTap={{ scale: 0.98 }}
        transition={{
          type: "spring",
          stiffness: 400,
          damping: 25,
        }}
        {...props}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <div
      data-slot="glass-card"
      className={cn(
        "bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl",
        "hover:bg-white/[0.07] transition-all duration-300",
        className
      )}
      {...(props as React.ComponentProps<"div">)}
    >
      {children}
    </div>
  )
}

// Animated card wrapper for entrance animations
interface AnimatedCardProps extends HTMLMotionProps<"div"> {
  children?: React.ReactNode
  delay?: number
}

function AnimatedCard({ className, delay = 0, children, ...props }: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay,
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1],
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, GlassCard, AnimatedCard }
