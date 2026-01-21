import { NextRequest, NextResponse } from "next/server"
import { sql, formatDate } from "@/lib/db"

const USER_ID = "default_user"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const date = searchParams.get("date") || formatDate(new Date())
  const days = parseInt(searchParams.get("days") || "7")

  try {
    // Get today's recovery
    const today = await sql`
      SELECT *
      FROM recovery_scores
      WHERE user_id = ${USER_ID} AND date = ${date}
      ORDER BY calculated_at DESC
      LIMIT 1
    `

    // Get history
    const history = await sql`
      SELECT date, recovery_score, sleep_score, energy_level, muscle_soreness
      FROM recovery_scores
      WHERE user_id = ${USER_ID}
        AND date >= CURRENT_DATE - ${days}::int
      ORDER BY date DESC
    `

    // Get today's sleep
    const sleep = await sql`
      SELECT *
      FROM sleep_logs
      WHERE user_id = ${USER_ID} AND date = ${date}
      ORDER BY logged_at DESC
      LIMIT 1
    `

    // Get today's heart rate
    const heartRate = await sql`
      SELECT *
      FROM heart_rate_logs
      WHERE user_id = ${USER_ID} AND date = ${date}
      ORDER BY measured_at DESC
      LIMIT 1
    `

    return NextResponse.json({
      date,
      recovery: today[0] || null,
      sleep: sleep[0] || null,
      heartRate: heartRate[0] || null,
      history,
    })
  } catch (error) {
    console.error("Error fetching recovery data:", error)
    return NextResponse.json(
      { error: "Failed to fetch recovery data" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      recovery_score,
      sleep_score,
      hrv_score,
      muscle_soreness,
      energy_level,
      date,
    } = body

    const scoreDate = date || formatDate(new Date())

    // Upsert recovery score (update if exists for today, otherwise insert)
    const result = await sql`
      INSERT INTO recovery_scores (
        user_id, date, recovery_score, sleep_score, hrv_score,
        muscle_soreness, energy_level
      )
      VALUES (
        ${USER_ID}, ${scoreDate}, ${recovery_score}, ${sleep_score || null},
        ${hrv_score || null}, ${muscle_soreness || null}, ${energy_level || null}
      )
      ON CONFLICT (user_id, date) DO UPDATE SET
        recovery_score = EXCLUDED.recovery_score,
        sleep_score = EXCLUDED.sleep_score,
        hrv_score = EXCLUDED.hrv_score,
        muscle_soreness = EXCLUDED.muscle_soreness,
        energy_level = EXCLUDED.energy_level,
        calculated_at = CURRENT_TIMESTAMP
      RETURNING id
    `

    return NextResponse.json({ success: true, id: result[0].id })
  } catch (error) {
    console.error("Error saving recovery score:", error)
    return NextResponse.json(
      { error: "Failed to save recovery score" },
      { status: 500 }
    )
  }
}
