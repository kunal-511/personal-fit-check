import { NextRequest, NextResponse } from "next/server"
import { sql, formatDate } from "@/lib/db"

const USER_ID = "default_user"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const limit = parseInt(searchParams.get("limit") || "10")
  const date = searchParams.get("date")

  try {
    let sessions

    if (date) {
      sessions = await sql`
        SELECT *
        FROM cardio_sessions
        WHERE user_id = ${USER_ID} AND date = ${date}
        ORDER BY logged_at DESC
      `
    } else {
      sessions = await sql`
        SELECT *
        FROM cardio_sessions
        WHERE user_id = ${USER_ID}
        ORDER BY date DESC, logged_at DESC
        LIMIT ${limit}
      `
    }

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error("Error fetching cardio sessions:", error)
    return NextResponse.json(
      { error: "Failed to fetch cardio sessions" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      cardio_type,
      duration_minutes,
      distance_km,
      avg_heart_rate,
      calories_burned,
      notes,
      date,
    } = body

    const sessionDate = date || formatDate(new Date())

    const result = await sql`
      INSERT INTO cardio_sessions (
        user_id, date, cardio_type, duration_minutes, distance_km,
        avg_heart_rate, calories_burned, notes
      )
      VALUES (
        ${USER_ID}, ${sessionDate}, ${cardio_type}, ${duration_minutes},
        ${distance_km || null}, ${avg_heart_rate || null},
        ${calories_burned || null}, ${notes || null}
      )
      RETURNING id
    `

    return NextResponse.json({ success: true, session_id: result[0].id })
  } catch (error) {
    console.error("Error creating cardio session:", error)
    return NextResponse.json(
      { error: "Failed to create cardio session" },
      { status: 500 }
    )
  }
}
