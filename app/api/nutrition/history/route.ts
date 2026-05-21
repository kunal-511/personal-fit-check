import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { format, subDays } from "date-fns"

const USER_ID = "default_user"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const days = Math.min(30, Math.max(7, parseInt(searchParams.get("days") || "7")))

  try {
    // Fetch goals
    const goalsRows = await sql`
      SELECT daily_calories, protein_g, carbs_g, fats_g
      FROM nutrition_goals
      WHERE user_id = ${USER_ID}
      LIMIT 1
    `
    const goals = goalsRows[0] || {
      daily_calories: 1900,
      protein_g: 110,
      carbs_g: 230,
      fats_g: 60,
    }

    // Fetch per-day totals for the last N days
    const rows = await sql`
      SELECT
        m.date,
        COALESCE(SUM(f.calories * f.quantity), 0)::real  AS calories,
        COALESCE(SUM(f.protein_g * f.quantity), 0)::real AS protein,
        COALESCE(SUM(f.carbs_g * f.quantity), 0)::real   AS carbs,
        COALESCE(SUM(f.fats_g * f.quantity), 0)::real    AS fats
      FROM meals m
      LEFT JOIN food_items f ON m.id = f.meal_id
      WHERE m.user_id = ${USER_ID}
        AND m.date >= (CURRENT_DATE - (${days - 1} || ' days')::interval)::date
      GROUP BY m.date
      ORDER BY m.date
    `

    // Build a full date-range map so days with no meals show 0
    type DayRow = { date: string | Date; calories: number; protein: number; carbs: number; fats: number }
    const normalizeDateKey = (value: string | Date) => {
      if (value instanceof Date) return format(value, "yyyy-MM-dd")
      return value.slice(0, 10)
    }
    const byDate = new Map<string, DayRow>()
    for (const row of rows as unknown as DayRow[]) {
      byDate.set(normalizeDateKey(row.date), row)
    }

    const today = new Date()
    const history = Array.from({ length: days }, (_, i) => {
      const d = subDays(today, days - 1 - i)
      const dateStr = format(d, "yyyy-MM-dd")
      const entry = byDate.get(dateStr)
      return {
        date: dateStr,
        day: format(d, "EEE"),          // "Mon", "Tue" …
        shortDate: format(d, "MMM d"),  // "May 14"
        calories: Math.round(entry?.calories ?? 0),
        protein:  Math.round(entry?.protein  ?? 0),
        carbs:    Math.round(entry?.carbs    ?? 0),
        fats:     Math.round(entry?.fats     ?? 0),
      }
    })

    // Rolling averages (exclude days with 0 intake to avoid skewing)
    const activeDays = history.filter(d => d.calories > 0)
    const avg = (key: keyof typeof history[0]) =>
      activeDays.length
        ? Math.round(activeDays.reduce((s, d) => s + (d[key] as number), 0) / activeDays.length)
        : 0

    return NextResponse.json({
      history,
      goals: {
        calories: Number(goals.daily_calories),
        protein:  Number(goals.protein_g),
        carbs:    Number(goals.carbs_g),
        fats:     Number(goals.fats_g),
      },
      averages: {
        calories: avg("calories"),
        protein:  avg("protein"),
        carbs:    avg("carbs"),
        fats:     avg("fats"),
      },
    })
  } catch (error) {
    console.error("Error fetching nutrition history:", error)
    return NextResponse.json({ error: "Failed to fetch nutrition history" }, { status: 500 })
  }
}
