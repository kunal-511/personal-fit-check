import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

const USER_ID = "default_user"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const limitParam = Number.parseInt(searchParams.get("limit") || "5", 10)
  const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 20) : 5

  try {
    const rows = await sql`
      SELECT
        m.id,
        m.date,
        m.meal_type,
        m.meal_name,
        m.notes,
        m.logged_at,
        COALESCE(SUM(f.calories * f.quantity), 0)::real AS calories,
        COALESCE(SUM(f.protein_g * f.quantity), 0)::real AS protein,
        COALESCE(SUM(f.carbs_g * f.quantity), 0)::real AS carbs,
        COALESCE(SUM(f.fats_g * f.quantity), 0)::real AS fats
      FROM meals m
      LEFT JOIN food_items f ON m.id = f.meal_id
      WHERE m.user_id = ${USER_ID}
      GROUP BY m.id
      ORDER BY m.logged_at DESC
      LIMIT ${limit}
    `

    type RecentMealRow = {
      id: number
      date: string
      meal_type: string | null
      meal_name: string | null
      notes: string | null
      logged_at: string
      calories: number
      protein: number
      carbs: number
      fats: number
    }

    const meals = (rows as unknown as RecentMealRow[]).map((row) => ({
      id: row.id,
      date: row.date,
      meal_type: row.meal_type,
      meal_name: row.meal_name,
      notes: row.notes,
      logged_at: row.logged_at,
      totals: {
        calories: row.calories,
        protein: row.protein,
        carbs: row.carbs,
        fats: row.fats,
      },
    }))

    return NextResponse.json({ meals })
  } catch (error) {
    console.error("Error fetching recent meals:", error)
    return NextResponse.json({ error: "Failed to fetch recent meals" }, { status: 500 })
  }
}

