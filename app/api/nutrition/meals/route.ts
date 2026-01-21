import { NextRequest, NextResponse } from "next/server"
import { sql, formatDate } from "@/lib/db"

const USER_ID = "default_user"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { meal_type, meal_name, notes, food_items, date } = body

    const mealDate = date || formatDate(new Date())
    const mealNotes = notes ?? null
    const mealNameValue = meal_name || null

    // Create meal
    const meal = await sql`
      INSERT INTO meals (user_id, date, meal_type, meal_name, notes)
      VALUES (${USER_ID}, ${mealDate}, ${meal_type}, ${mealNameValue}, ${mealNotes})
      RETURNING id
    `

    const mealId = meal[0].id

    // Add food items if provided
    if (food_items && food_items.length > 0) {
      for (const item of food_items) {
        await sql`
          INSERT INTO food_items (
            meal_id, food_name, quantity, unit, calories,
            protein_g, carbs_g, fats_g, fiber_g, sugar_g
          )
          VALUES (
            ${mealId}, ${item.food_name}, ${item.quantity || 1},
            ${item.unit || 'serving'}, ${item.calories || 0},
            ${item.protein_g || 0}, ${item.carbs_g || 0}, ${item.fats_g || 0},
            ${item.fiber_g || null}, ${item.sugar_g || null}
          )
        `
      }
    }

    return NextResponse.json({ success: true, meal_id: mealId })
  } catch (error) {
    console.error("Error creating meal:", error)
    return NextResponse.json(
      { error: "Failed to create meal" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const mealId = searchParams.get("id")

  if (!mealId) {
    return NextResponse.json({ error: "Meal ID required" }, { status: 400 })
  }

  try {
    await sql`DELETE FROM meals WHERE id = ${mealId} AND user_id = ${USER_ID}`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting meal:", error)
    return NextResponse.json(
      { error: "Failed to delete meal" },
      { status: 500 }
    )
  }
}
