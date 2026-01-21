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
        FROM sleep_logs
        WHERE user_id = ${USER_ID} AND date = ${date}
        ORDER BY logged_at DESC
        LIMIT 1
      `
      latest = result[0] || null
    } else {
      // Get latest entry
      const latestResult = await sql`
        SELECT *
        FROM sleep_logs
        WHERE user_id = ${USER_ID}
        ORDER BY date DESC, logged_at DESC
        LIMIT 1
      `
      latest = latestResult[0] || null
    }

    // Get history
    history = await sql`
      SELECT date, hours_slept, quality_rating, bedtime, wake_time, notes
      FROM sleep_logs
      WHERE user_id = ${USER_ID}
        AND date >= CURRENT_DATE - ${days}::int
      ORDER BY date DESC
    `

    // Calculate weekly average
    const weeklyStats = await sql`
      SELECT
        AVG(hours_slept) as avg_hours,
        AVG(quality_rating) as avg_quality,
        COUNT(*) as total_logs
      FROM sleep_logs
      WHERE user_id = ${USER_ID}
        AND date >= CURRENT_DATE - 7
    `

    return NextResponse.json({
      latest,
      history,
      stats: weeklyStats[0] || { avg_hours: 0, avg_quality: 0, total_logs: 0 },
    })
  } catch (error) {
    console.error("Error fetching sleep data:", error)
    return NextResponse.json(
      { error: "Failed to fetch sleep data" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      bedtime,
      wake_time,
      hours_slept,
      quality_rating,
      notes,
      date,
    } = body

    const sleepDate = date || formatDate(new Date())

    // Calculate hours_slept from bedtime and wake_time if not provided
    let calculatedHours = hours_slept
    if (!calculatedHours && bedtime && wake_time) {
      const [bedHour, bedMin] = bedtime.split(":").map(Number)
      const [wakeHour, wakeMin] = wake_time.split(":").map(Number)

      let bedMinutes = bedHour * 60 + bedMin
      let wakeMinutes = wakeHour * 60 + wakeMin

      // Handle overnight sleep (bedtime is PM, wake time is AM)
      if (wakeMinutes < bedMinutes) {
        wakeMinutes += 24 * 60
      }

      calculatedHours = Math.round((wakeMinutes - bedMinutes) / 60 * 10) / 10
    }

    // Check if entry already exists for this date
    const existing = await sql`
      SELECT id FROM sleep_logs
      WHERE user_id = ${USER_ID} AND date = ${sleepDate}
    `

    let result
    if (existing.length > 0) {
      // Update existing entry
      result = await sql`
        UPDATE sleep_logs
        SET
          bedtime = ${bedtime || null},
          wake_time = ${wake_time || null},
          hours_slept = ${calculatedHours || null},
          quality_rating = ${quality_rating || null},
          notes = ${notes || null},
          logged_at = CURRENT_TIMESTAMP
        WHERE user_id = ${USER_ID} AND date = ${sleepDate}
        RETURNING id
      `
    } else {
      // Insert new entry
      result = await sql`
        INSERT INTO sleep_logs (
          user_id, date, bedtime, wake_time, hours_slept, quality_rating, notes
        )
        VALUES (
          ${USER_ID}, ${sleepDate}, ${bedtime || null}, ${wake_time || null},
          ${calculatedHours || null}, ${quality_rating || null}, ${notes || null}
        )
        RETURNING id
      `
    }

    return NextResponse.json({ success: true, id: result[0].id })
  } catch (error) {
    console.error("Error saving sleep data:", error)
    return NextResponse.json(
      { error: "Failed to save sleep data" },
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
      DELETE FROM sleep_logs
      WHERE user_id = ${USER_ID} AND date = ${date}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting sleep data:", error)
    return NextResponse.json(
      { error: "Failed to delete sleep data" },
      { status: 500 }
    )
  }
}
