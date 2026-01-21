import { NextRequest, NextResponse } from "next/server"
import { sql, formatDate } from "@/lib/db"

const USER_ID = "default_user"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const date = searchParams.get("date")
  const days = parseInt(searchParams.get("days") || "7")

  try {
    let latest = null
    let history = []

    if (date) {
      // Get specific date
      const result = await sql`
        SELECT *
        FROM heart_rate_logs
        WHERE user_id = ${USER_ID} AND date = ${date}
        ORDER BY measured_at DESC
        LIMIT 1
      `
      latest = result[0] || null
    } else {
      // Get latest entry
      const latestResult = await sql`
        SELECT *
        FROM heart_rate_logs
        WHERE user_id = ${USER_ID}
        ORDER BY date DESC, measured_at DESC
        LIMIT 1
      `
      latest = latestResult[0] || null
    }

    // Get history
    history = await sql`
      SELECT date, resting_hr, avg_hr, max_hr
      FROM heart_rate_logs
      WHERE user_id = ${USER_ID}
        AND date >= CURRENT_DATE - ${days}::int
      ORDER BY date DESC
    `

    // Calculate average resting HR over the period
    const stats = await sql`
      SELECT
        AVG(resting_hr) as avg_resting_hr,
        MIN(resting_hr) as min_resting_hr,
        MAX(resting_hr) as max_resting_hr,
        COUNT(*) as total_logs
      FROM heart_rate_logs
      WHERE user_id = ${USER_ID}
        AND date >= CURRENT_DATE - ${days}::int
    `

    return NextResponse.json({
      latest,
      history,
      stats: stats[0] || { avg_resting_hr: 0, min_resting_hr: 0, max_resting_hr: 0, total_logs: 0 },
    })
  } catch (error) {
    console.error("Error fetching heart rate data:", error)
    return NextResponse.json(
      { error: "Failed to fetch heart rate data" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      resting_hr,
      avg_hr,
      max_hr,
      date,
    } = body

    const hrDate = date || formatDate(new Date())

    // Check if entry already exists for this date
    const existing = await sql`
      SELECT id FROM heart_rate_logs
      WHERE user_id = ${USER_ID} AND date = ${hrDate}
    `

    let result
    if (existing.length > 0) {
      // Update existing entry
      result = await sql`
        UPDATE heart_rate_logs
        SET
          resting_hr = ${resting_hr || null},
          avg_hr = ${avg_hr || null},
          max_hr = ${max_hr || null},
          measured_at = CURRENT_TIMESTAMP
        WHERE user_id = ${USER_ID} AND date = ${hrDate}
        RETURNING id
      `
    } else {
      // Insert new entry
      result = await sql`
        INSERT INTO heart_rate_logs (
          user_id, date, resting_hr, avg_hr, max_hr
        )
        VALUES (
          ${USER_ID}, ${hrDate}, ${resting_hr || null}, ${avg_hr || null}, ${max_hr || null}
        )
        RETURNING id
      `
    }

    return NextResponse.json({ success: true, id: result[0].id })
  } catch (error) {
    console.error("Error saving heart rate data:", error)
    return NextResponse.json(
      { error: "Failed to save heart rate data" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const date = searchParams.get("date")

  if (!date) {
    return NextResponse.json(
      { error: "Date parameter is required" },
      { status: 400 }
    )
  }

  try {
    await sql`
      DELETE FROM heart_rate_logs
      WHERE user_id = ${USER_ID} AND date = ${date}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting heart rate data:", error)
    return NextResponse.json(
      { error: "Failed to delete heart rate data" },
      { status: 500 }
    )
  }
}
