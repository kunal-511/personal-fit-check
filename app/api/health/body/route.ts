import { NextRequest, NextResponse } from "next/server"
import { sql, formatDate } from "@/lib/db"

const USER_ID = "default_user"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const date = searchParams.get("date")
  const days = parseInt(searchParams.get("days") || "30")

  try {
    let metrics

    if (date) {
      // Get specific date
      metrics = await sql`
        SELECT *
        FROM body_metrics
        WHERE user_id = ${USER_ID} AND date = ${date}
        ORDER BY logged_at DESC
        LIMIT 1
      `
    } else {
      // Get history
      metrics = await sql`
        SELECT date, weight_kg, body_fat_percent, waist_cm, chest_cm
        FROM body_metrics
        WHERE user_id = ${USER_ID}
          AND date >= CURRENT_DATE - ${days}::int
        ORDER BY date DESC
      `
    }

    // Get latest entry
    const latest = await sql`
      SELECT *
      FROM body_metrics
      WHERE user_id = ${USER_ID}
      ORDER BY date DESC, logged_at DESC
      LIMIT 1
    `

    // Get previous entry for comparison
    const previous = await sql`
      SELECT weight_kg, body_fat_percent
      FROM body_metrics
      WHERE user_id = ${USER_ID}
      ORDER BY date DESC, logged_at DESC
      OFFSET 1
      LIMIT 1
    `

    const latestData = latest[0] || null
    const previousData = previous[0] || null

    const changes = latestData && previousData ? {
      weight: latestData.weight_kg - previousData.weight_kg,
      body_fat: latestData.body_fat_percent - previousData.body_fat_percent,
    } : null

    return NextResponse.json({
      latest: latestData,
      history: metrics,
      changes,
    })
  } catch (error) {
    console.error("Error fetching body metrics:", error)
    return NextResponse.json(
      { error: "Failed to fetch body metrics" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      weight_kg,
      body_fat_percent,
      chest_cm,
      waist_cm,
      hips_cm,
      left_arm_cm,
      right_arm_cm,
      left_thigh_cm,
      right_thigh_cm,
      notes,
      date,
    } = body

    const metricDate = date || formatDate(new Date())

    const result = await sql`
      INSERT INTO body_metrics (
        user_id, date, weight_kg, body_fat_percent,
        chest_cm, waist_cm, hips_cm,
        left_arm_cm, right_arm_cm, left_thigh_cm, right_thigh_cm,
        notes
      )
      VALUES (
        ${USER_ID}, ${metricDate}, ${weight_kg || null}, ${body_fat_percent || null},
        ${chest_cm || null}, ${waist_cm || null}, ${hips_cm || null},
        ${left_arm_cm || null}, ${right_arm_cm || null},
        ${left_thigh_cm || null}, ${right_thigh_cm || null},
        ${notes || null}
      )
      RETURNING id
    `

    return NextResponse.json({ success: true, id: result[0].id })
  } catch (error) {
    console.error("Error saving body metrics:", error)
    return NextResponse.json(
      { error: "Failed to save body metrics" },
      { status: 500 }
    )
  }
}
