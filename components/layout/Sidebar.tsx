"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home,
  Utensils,
  Dumbbell,
  Heart,
  ChevronLeft,
  Activity,
  Target,
  Moon,
  LogOut
} from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { workoutsApi } from "@/lib/api"
import type { Workout } from "@/types"

interface SidebarProps {
  collapsed?: boolean
  onToggle?: () => void
}

const navItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: Home,
  },
  {
    title: "Nutrition",
    href: "/nutrition",
    icon: Utensils,
  },
  {
    title: "Workouts",
    href: "/workouts",
    icon: Dumbbell,
  },
  {
    title: "Health",
    href: "/health",
    icon: Heart,
  },
]

interface QuickStats {
  activeDays: number
  goal: string
  restDays: number
}

export function Sidebar({ collapsed = false, onToggle }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [stats, setStats] = useState<QuickStats>({
    activeDays: 0,
    goal: "Muscle & Strength",
    restDays: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  const handleLogout = async () => {
    await fetch("/api/auth", { method: "DELETE" })
    router.push("/login")
    router.refresh()
  }

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await workoutsApi.getAll(100)
        const workouts = res?.workouts || []

        // Calculate unique days with workouts (last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const uniqueDays = new Set(
          workouts
            .filter((w: Workout) => new Date(w.date) >= thirtyDaysAgo)
            .map((w: Workout) => w.date.split("T")[0])
        )
        const activeDays = uniqueDays.size

        // Calculate rest days (days since last workout)
        let restDays = 0
        if (workouts.length > 0) {
          const lastWorkoutDate = new Date(workouts[0].date)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          lastWorkoutDate.setHours(0, 0, 0, 0)
          restDays = Math.floor((today.getTime() - lastWorkoutDate.getTime()) / (1000 * 60 * 60 * 24))
        }

        setStats({
          activeDays,
          goal: "Muscle & Strength",
          restDays,
        })
      } catch (error) {
        console.error("Failed to fetch stats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  const quickStats = [
    { icon: Activity, label: "Active", value: isLoading ? "..." : `${stats.activeDays} days` },
    { icon: Target, label: "Goal", value: stats.goal },
    { icon: Moon, label: "Rest", value: isLoading ? "..." : `${stats.restDays} days` },
  ]

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r border-border/50 bg-card/50 backdrop-blur-xl transition-all duration-300",
        collapsed ? "w-[var(--sidebar-width-collapsed)]" : "w-[var(--sidebar-width)]",
        "hidden lg:block"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-border/50 px-4">
          {!collapsed && (
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Activity className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-semibold gradient-text">FitTrack</span>
            </Link>
          )}
          {collapsed && (
            <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Activity className="h-5 w-5 text-primary-foreground" />
            </div>
          )}
          {onToggle && !collapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  "hover:bg-secondary/80",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground",
                  collapsed && "justify-center px-2"
                )}
              >
                <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary")} />
                {!collapsed && <span>{item.title}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Quick Stats (only when not collapsed) */}
        {!collapsed && (
          <div className="border-t border-border/50 p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Quick Stats
            </p>
            <div className="space-y-2">
              {quickStats.map((stat) => (
                <div
                  key={stat.label}
                  className="flex items-center justify-between rounded-lg bg-secondary/50 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <stat.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{stat.label}</span>
                  </div>
                  <span className="text-sm font-medium">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Logout */}
        <div className="border-t border-border/50 p-3">
          <Button
            variant="ghost"
            size={collapsed ? "icon" : "default"}
            onClick={handleLogout}
            className={cn(
              "w-full text-muted-foreground hover:text-foreground",
              collapsed && "mx-auto flex h-8 w-8"
            )}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="ml-2">Logout</span>}
          </Button>
        </div>

        {/* Toggle button when collapsed */}
        {collapsed && onToggle && (
          <div className="border-t border-border/50 p-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="mx-auto flex h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4 rotate-180" />
            </Button>
          </div>
        )}
      </div>
    </aside>
  )
}
