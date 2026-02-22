import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

const USER_ID = "default_user"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const month = searchParams.get("month") // YYYY-MM format

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "month is required (YYYY-MM)" }, { status: 400 })
  }

  const [year, monthNum] = month.split("-").map(Number)
  const startDate = `${month}-01`
  // Last day of month
  const lastDay = new Date(year, monthNum, 0).getDate()
  const endDate = `${month}-${String(lastDay).padStart(2, "0")}`

  try {
    const rows = await sql`
      SELECT
        TO_CHAR(date, 'YYYY-MM-DD') AS date,
        id,
        title,
        workout_type,
        duration_minutes
      FROM workouts
      WHERE user_id = ${USER_ID}
        AND date >= ${startDate}::date
        AND date <= ${endDate}::date
      ORDER BY date, id
    `

    // Group workouts by date
    const workouts: Record<string, Array<{
      id: number
      title: string
      workout_type: string
      duration_minutes: number | null
    }>> = {}

    for (const row of rows) {
      const key = row.date as string
      if (!workouts[key]) workouts[key] = []
      workouts[key].push({
        id: row.id as number,
        title: row.title as string,
        workout_type: row.workout_type as string,
        duration_minutes: row.duration_minutes as number | null,
      })
    }

    return NextResponse.json({ workouts })
  } catch (error) {
    console.error("Error fetching calendar workouts:", error)
    return NextResponse.json({ error: "Failed to fetch calendar" }, { status: 500 })
  }
}
