import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

const USER_ID = "default_user"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const limit = Math.min(Number(searchParams.get("limit") || 6), 50)
  const mealType = searchParams.get("meal_type")

  try {
    const foods = mealType
      ? await sql`
          SELECT food_name, unit, calories, protein_g, carbs_g, fats_g, use_count, last_used_at
          FROM frequent_foods
          WHERE user_id = ${USER_ID} AND meal_type = ${mealType}
          ORDER BY use_count DESC, last_used_at DESC
          LIMIT ${limit}
        `
      : await sql`
          SELECT food_name, unit, calories, protein_g, carbs_g, fats_g, use_count, last_used_at
          FROM frequent_foods
          WHERE user_id = ${USER_ID}
          ORDER BY use_count DESC, last_used_at DESC
          LIMIT ${limit}
        `

    const rows = foods as unknown as Array<{
      food_name: string
      unit: string
      calories: number
      protein_g: number
      carbs_g: number
      fats_g: number
      use_count: number
      last_used_at: string
    }>

    return NextResponse.json({
      foods: rows.map((food) => ({
        name: food.food_name,
        unit: food.unit || "serving",
        calories: Number(food.calories) || 0,
        protein: Number(food.protein_g) || 0,
        carbs: Number(food.carbs_g) || 0,
        fats: Number(food.fats_g) || 0,
        use_count: food.use_count,
        last_used_at: food.last_used_at,
      })),
    })
  } catch (error) {
    console.error("Error fetching frequent foods:", error)
    return NextResponse.json(
      { error: "Failed to fetch frequent foods" },
      { status: 500 }
    )
  }
}
