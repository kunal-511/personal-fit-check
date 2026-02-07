import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

const USER_ID = "default_user"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const limit = parseInt(searchParams.get("limit") || "6")

  try {
    const exercises = await sql`
      SELECT
        e.exercise_name,
        e.muscle_group,
        COUNT(*)::int as count,
        MAX(w.date) as last_used
      FROM exercises e
      INNER JOIN workouts w ON w.id = e.workout_id
      WHERE w.user_id = ${USER_ID}
      GROUP BY e.exercise_name, e.muscle_group
      ORDER BY count DESC, last_used DESC
      LIMIT ${limit}
    `

    return NextResponse.json({ exercises })
  } catch (error) {
    console.error("Error fetching frequent exercises:", error)
    return NextResponse.json(
      { error: "Failed to fetch frequent exercises" },
      { status: 500 }
    )
  }
}
