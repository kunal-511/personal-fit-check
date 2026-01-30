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
        const foodName = item.food_name
        const unit = item.unit || "serving"
        const calories = item.calories || 0
        const protein = item.protein_g || 0
        const carbs = item.carbs_g || 0
        const fats = item.fats_g || 0

        await sql`
          INSERT INTO food_items (
            meal_id, food_name, quantity, unit, calories,
            protein_g, carbs_g, fats_g, fiber_g, sugar_g
          )
          VALUES (
            ${mealId}, ${foodName}, ${item.quantity || 1},
            ${unit}, ${calories},
            ${protein}, ${carbs}, ${fats},
            ${item.fiber_g || null}, ${item.sugar_g || null}
          )
        `

        // Update frequent foods for quick add
        await sql`
          INSERT INTO frequent_foods (
            user_id, meal_type, food_name, unit, calories, protein_g, carbs_g, fats_g, use_count, last_used_at
          )
          VALUES (
            ${USER_ID}, ${meal_type}, ${foodName}, ${unit}, ${calories}, ${protein}, ${carbs}, ${fats}, 1, CURRENT_TIMESTAMP
          )
          ON CONFLICT (user_id, meal_type, food_name, unit) DO UPDATE SET
            calories = EXCLUDED.calories,
            protein_g = EXCLUDED.protein_g,
            carbs_g = EXCLUDED.carbs_g,
            fats_g = EXCLUDED.fats_g,
            use_count = frequent_foods.use_count + 1,
            last_used_at = CURRENT_TIMESTAMP
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
