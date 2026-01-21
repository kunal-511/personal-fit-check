import { NextRequest, NextResponse } from "next/server"
import { sql, formatDate } from "@/lib/db"

const USER_ID = "default_user"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const date = searchParams.get("date") || formatDate(new Date())

  try {
    const result = await sql`
      SELECT
        COALESCE(SUM(amount_ml), 0)::int as total,
        COUNT(*)::int as entries
      FROM water_logs
      WHERE user_id = ${USER_ID} AND date = ${date}
    `

    const logs = await sql`
      SELECT id, amount_ml, logged_at
      FROM water_logs
      WHERE user_id = ${USER_ID} AND date = ${date}
      ORDER BY logged_at DESC
    `

    return NextResponse.json({
      date,
      total: result[0].total,
      entries: result[0].entries,
      logs,
    })
  } catch (error) {
    console.error("Error fetching water logs:", error)
    return NextResponse.json(
      { error: "Failed to fetch water data" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount_ml, date } = body

    if (!amount_ml || amount_ml <= 0) {
      return NextResponse.json(
        { error: "Valid amount_ml required" },
        { status: 400 }
      )
    }

    const logDate = date || formatDate(new Date())

    const result = await sql`
      INSERT INTO water_logs (user_id, date, amount_ml)
      VALUES (${USER_ID}, ${logDate}, ${amount_ml})
      RETURNING id
    `

    // Get updated total
    const total = await sql`
      SELECT COALESCE(SUM(amount_ml), 0)::int as total
      FROM water_logs
      WHERE user_id = ${USER_ID} AND date = ${logDate}
    `

    return NextResponse.json({
      success: true,
      id: result[0].id,
      total: total[0].total,
    })
  } catch (error) {
    console.error("Error logging water:", error)
    return NextResponse.json(
      { error: "Failed to log water" },
      { status: 500 }
    )
  }
}
