import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

const USER_ID = "default_user"

export async function GET() {
  try {
    const goals = await sql`
      SELECT daily_calories, protein_g, carbs_g, fats_g, water_ml
      FROM nutrition_goals
      WHERE user_id = ${USER_ID}
      LIMIT 1
    `

    const goal = goals[0] || {
      daily_calories: 1900,
      protein_g: 110,
      carbs_g: 230,
      fats_g: 60,
      water_ml: 4000,
    }

    return NextResponse.json({ goals: goal })
  } catch (error) {
    console.error("Error fetching nutrition goals:", error)
    return NextResponse.json(
      { error: "Failed to fetch nutrition goals" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      daily_calories,
      protein_g,
      carbs_g,
      fats_g,
      water_ml,
    } = body || {}

    if (
      daily_calories == null ||
      protein_g == null ||
      carbs_g == null ||
      fats_g == null ||
      water_ml == null
    ) {
      return NextResponse.json(
        { error: "All goal fields are required" },
        { status: 400 }
      )
    }

    const updated = await sql`
      UPDATE nutrition_goals
      SET
        daily_calories = ${daily_calories},
        protein_g = ${protein_g},
        carbs_g = ${carbs_g},
        fats_g = ${fats_g},
        water_ml = ${water_ml},
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ${USER_ID}
      RETURNING id
    `

    if (updated.length === 0) {
      await sql`
        INSERT INTO nutrition_goals (
          user_id, daily_calories, protein_g, carbs_g, fats_g, water_ml, updated_at
        )
        VALUES (
          ${USER_ID}, ${daily_calories}, ${protein_g}, ${carbs_g}, ${fats_g}, ${water_ml}, CURRENT_TIMESTAMP
        )
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating nutrition goals:", error)
    return NextResponse.json(
      { error: "Failed to update nutrition goals" },
      { status: 500 }
    )
  }
}
