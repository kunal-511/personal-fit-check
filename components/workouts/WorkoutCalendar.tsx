"use client"

import { useState, useEffect, useCallback } from "react"
import {
  ChevronLeft,
  ChevronRight,
  X,
  Dumbbell,
  Clock,
  ArrowRight,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { workoutsApi } from "@/lib/api"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isToday,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns"

interface WorkoutEntry {
  id: number
  title: string
  workout_type: string
  duration_minutes: number | null
}

type CalendarData = Record<string, WorkoutEntry[]>

interface WorkoutCalendarProps {
  isOpen: boolean
  onClose: () => void
}

// Two-letter labels to avoid S/T ambiguity on small screens
const DAY_LABELS_LONG  = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const DAY_LABELS_SHORT = ["Su",  "Mo",  "Tu",  "We",  "Th",  "Fr",  "Sa"]

export function WorkoutCalendar({ isOpen, onClose }: WorkoutCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [calendarData, setCalendarData] = useState<CalendarData>({})
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [loading, setLoading] = useState(false)

  const monthKey = format(currentMonth, "yyyy-MM")

  const fetchCalendarData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await workoutsApi.getCalendar(monthKey)
      setCalendarData(res?.workouts || {})
    } catch (error) {
      console.error("Failed to fetch calendar data:", error)
      setCalendarData({})
    } finally {
      setLoading(false)
    }
  }, [monthKey])

  useEffect(() => {
    if (isOpen) fetchCalendarData()
  }, [isOpen, fetchCalendarData])

  // Reset selected date when month changes
  useEffect(() => {
    setSelectedDate(null)
  }, [monthKey])

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [isOpen, onClose])

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [isOpen])

  const monthStart = startOfMonth(currentMonth)
  const monthEnd   = endOfMonth(currentMonth)
  const calStart   = startOfWeek(monthStart, { weekStartsOn: 0 })
  const calEnd     = endOfWeek(monthEnd,     { weekStartsOn: 0 })
  const days       = eachDayOfInterval({ start: calStart, end: calEnd })

  const getWorkoutsForDate = (date: Date): WorkoutEntry[] =>
    calendarData[format(date, "yyyy-MM-dd")] || []

  const selectedWorkouts = selectedDate ? getWorkoutsForDate(selectedDate) : []

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center px-0 sm:px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={cn(
          "relative w-full sm:max-w-[420px]",
          "bg-[hsl(222.2_84%_5.5%)] border border-white/10",
          "rounded-t-3xl sm:rounded-2xl shadow-2xl",
          "max-h-[92dvh] sm:max-h-[85dvh] flex flex-col",
          "animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
        )}
      >
        {/* Drag handle (mobile only) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden shrink-0">
          <div className="w-12 h-1.5 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 sm:py-4 border-b border-white/10 shrink-0">
          <h2 className="font-semibold text-base sm:text-lg">Workout Calendar</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-9 w-9 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-4 sm:px-5 py-4 space-y-4">

          {/* Month Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
              className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-white/10 active:bg-white/15 transition-colors touch-manipulation"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-base sm:text-lg">
                {format(currentMonth, "MMMM yyyy")}
              </span>
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
            </div>

            <button
              onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
              className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-white/10 active:bg-white/15 transition-colors touch-manipulation"
              aria-label="Next month"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7">
            {DAY_LABELS_LONG.map((day, i) => (
              <div
                key={day}
                className="text-center py-1"
              >
                <span className="hidden sm:inline text-[11px] font-medium text-muted-foreground">
                  {day}
                </span>
                <span className="sm:hidden text-[11px] font-medium text-muted-foreground">
                  {DAY_LABELS_SHORT[i]}
                </span>
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-y-1">
            {days.map((day) => {
              const workouts       = getWorkoutsForDate(day)
              const isCurrentMonth = isSameMonth(day, currentMonth)
              const isSelected     = selectedDate ? isSameDay(day, selectedDate) : false
              const hasStrength    = workouts.some((w) => w.workout_type === "strength")
              const hasCardio      = workouts.some((w) => w.workout_type === "cardio")
              const todayDate      = isToday(day)

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(isSelected ? null : day)}
                  className={cn(
                    "relative flex flex-col items-center justify-center gap-0.5 py-1 rounded-xl transition-colors touch-manipulation",
                    "min-h-[48px] sm:min-h-[52px]",
                    isCurrentMonth ? "opacity-100" : "opacity-20 pointer-events-none",
                    isSelected && "bg-primary/20 ring-1 ring-primary/60",
                    !isSelected && isCurrentMonth && "hover:bg-white/5 active:bg-white/10",
                    todayDate && !isSelected && "ring-1 ring-white/25"
                  )}
                >
                  <span
                    className={cn(
                      "text-sm font-medium w-8 h-8 flex items-center justify-center rounded-full leading-none",
                      todayDate && "bg-primary text-primary-foreground font-bold"
                    )}
                  >
                    {format(day, "d")}
                  </span>

                  {/* Workout type dots */}
                  <div className="flex gap-0.5 h-2 items-center">
                    {hasStrength && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    )}
                    {hasCardio && (
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    )}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-5 text-xs text-muted-foreground pb-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              Strength
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
              Cardio
            </span>
          </div>

          {/* Selected Date Panel */}
          {selectedDate && (
            <div className="border-t border-white/10 pt-4 space-y-3 pb-2">
              <h4 className="font-semibold text-sm">
                {format(selectedDate, "EEEE, MMMM d")}
              </h4>

              {selectedWorkouts.length > 0 ? (
                <div className="space-y-2">
                  {selectedWorkouts.map((workout) => (
                    <Link
                      key={workout.id}
                      href={`/workouts/history/${workout.id}`}
                      onClick={onClose}
                    >
                      <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-white/15 transition-colors touch-manipulation">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                            workout.workout_type === "strength"
                              ? "bg-emerald-500/20"
                              : "bg-orange-500/20"
                          )}
                        >
                          <Dumbbell
                            className={cn(
                              "h-5 w-5",
                              workout.workout_type === "strength"
                                ? "text-emerald-500"
                                : "text-orange-500"
                            )}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{workout.title}</p>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            {workout.duration_minutes && (
                              <>
                                <Clock className="h-3 w-3 shrink-0" />
                                <span>{workout.duration_minutes} min</span>
                                <span className="mx-0.5">·</span>
                              </>
                            )}
                            <span className="capitalize">{workout.workout_type}</span>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-3 text-center">
                  No workouts logged on this day
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
