"use client"

import { useRouter } from "next/navigation"
import { Calendar, ChevronLeft, ChevronRight, LogOut } from "lucide-react"
import { format, addDays, subDays } from "date-fns"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/lib/store"

interface HeaderProps {
  title?: string
}

export function Header({
  title,
}: HeaderProps) {
  const router = useRouter()
  const date = useAppStore((s) => s.selectedDate)
  const setDate = useAppStore((s) => s.setSelectedDate)

  const handleLogout = async () => {
    await fetch("/api/auth", { method: "DELETE" })
    router.push("/login")
    router.refresh()
  }

  const handlePreviousDay = () => {
    setDate(subDays(date, 1))
  }

  const handleNextDay = () => {
    setDate(addDays(date, 1))
  }

  const handleToday = () => {
    setDate(new Date())
  }

  const isToday = format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")

  return (
    <header className="sticky top-0 z-30 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 lg:px-6">
        {/* Left side */}
        <div className="flex items-center gap-4">
          {/* Page title or date selector */}
          {title ? (
            <h1 className="text-lg font-semibold">{title}</h1>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handlePreviousDay}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <button
                onClick={handleToday}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  isToday
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-secondary"
                )}
              >
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {isToday ? "Today" : format(date, "EEE, MMM d")}
                </span>
                <span className="sm:hidden">
                  {format(date, "MMM d")}
                </span>
              </button>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleNextDay}
                disabled={isToday}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-9 w-9 items-center justify-center cursor-pointer rounded-full bg-primary/10 text-sm font-medium text-primary transition-colors hover:bg-primary/20">
                KD
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
