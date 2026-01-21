"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Utensils, Dumbbell, Heart, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  {
    title: "Home",
    href: "/",
    icon: Home,
  },
  {
    title: "Nutrition",
    href: "/nutrition",
    icon: Utensils,
  },
  {
    title: "Add",
    href: "#",
    icon: Plus,
    isAction: true,
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

interface MobileNavProps {
  onAddClick?: () => void
}

export function MobileNav({ onAddClick }: MobileNavProps) {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-card/80 backdrop-blur-xl pb-safe lg:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href)

          if (item.isAction) {
            return (
              <button
                key={item.title}
                onClick={onAddClick}
                className="flex flex-col items-center justify-center"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/25 transition-transform hover:scale-105 active:scale-95">
                  <item.icon className="h-6 w-6 text-primary-foreground" />
                </div>
              </button>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "text-primary")} />
              <span className="text-[10px] font-medium">{item.title}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
