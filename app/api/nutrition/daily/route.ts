import { NextRequest, NextResponse } from "next/server"
import { sql, formatDate } from "@/lib/db"

const USER_ID = "default_user"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const date = searchParams.get("date") || formatDate(new Date())

  try {
    // Get nutrition goals
    const goals = await sql`
      SELECT daily_calories, protein_g, carbs_g, fats_g, water_ml
      FROM nutrition_goals
      WHERE user_id = ${USER_ID}
      LIMIT 1
    `

    // Get meals with food items for the date
    const mealsRaw = await sql`
      SELECT
        m.id,
        m.meal_type,
        m.meal_name,
        m.notes,
        m.logged_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id', f.id,
              'name', f.food_name,
              'food_name', f.food_name,
              'quantity', f.quantity,
              'unit', f.unit,
              'calories', f.calories,
              'protein', f.protein_g,
              'carbs', f.carbs_g,
              'fats', f.fats_g
            )
          ) FILTER (WHERE f.id IS NOT NULL),
          '[]'
        ) as food_items,
        COALESCE(SUM(f.calories * f.quantity), 0)::real as meal_calories,
        COALESCE(SUM(f.protein_g * f.quantity), 0)::real as meal_protein,
        COALESCE(SUM(f.carbs_g * f.quantity), 0)::real as meal_carbs,
        COALESCE(SUM(f.fats_g * f.quantity), 0)::real as meal_fats
      FROM meals m
      LEFT JOIN food_items f ON m.id = f.meal_id
      WHERE m.user_id = ${USER_ID} AND m.date = ${date}
      GROUP BY m.id
      ORDER BY m.logged_at
    `

    // Format meals with totals
    interface MealRow {
      id: number
      meal_type: string
      meal_name: string | null
      notes: string | null
      logged_at: string
      food_items: Array<{ id: number; name: string; food_name: string; quantity: number; unit: string; calories: number; protein: number; carbs: number; fats: number }>
      meal_calories: number
      meal_protein: number
      meal_carbs: number
      meal_fats: number
    }

    const meals = (mealsRaw as unknown as MealRow[]).map((meal) => ({
      id: meal.id,
      meal_type: meal.meal_type,
      meal_name: meal.meal_name,
      notes: meal.notes,
      logged_at: meal.logged_at,
      food_items: meal.food_items,
      totals: {
        calories: meal.meal_calories,
        protein: meal.meal_protein,
        carbs: meal.meal_carbs,
        fats: meal.meal_fats,
      },
    }))

    // Calculate totals
    const totals = await sql`
      SELECT
        COALESCE(SUM(f.calories * f.quantity), 0)::real as calories,
        COALESCE(SUM(f.protein_g * f.quantity), 0)::real as protein,
        COALESCE(SUM(f.carbs_g * f.quantity), 0)::real as carbs,
        COALESCE(SUM(f.fats_g * f.quantity), 0)::real as fats
      FROM meals m
      JOIN food_items f ON m.id = f.meal_id
      WHERE m.user_id = ${USER_ID} AND m.date = ${date}
    `

    // Get water intake
    const water = await sql`
      SELECT COALESCE(SUM(amount_ml), 0)::int as total
      FROM water_logs
      WHERE user_id = ${USER_ID} AND date = ${date}
    `

    const goal = goals[0] || {
      daily_calories: 1900,
      protein_g: 110,
      carbs_g: 230,
      fats_g: 60,
      water_ml: 3000,
    }

    const total = totals[0] || { calories: 0, protein: 0, carbs: 0, fats: 0 }
    const waterTotal = water[0]?.total || 0

    return NextResponse.json({
      date,
      totals: {
        calories: total.calories,
        protein: total.protein,
        carbs: total.carbs,
        fats: total.fats,
        water: waterTotal,
      },
      goals: {
        daily_calories: goal.daily_calories,
        protein_g: goal.protein_g,
        carbs_g: goal.carbs_g,
        fats_g: goal.fats_g,
        water_ml: goal.water_ml,
      },
      percentages: {
        calories: Math.round((total.calories / goal.daily_calories) * 100),
        protein: Math.round((total.protein / goal.protein_g) * 100),
        carbs: Math.round((total.carbs / goal.carbs_g) * 100),
        fats: Math.round((total.fats / goal.fats_g) * 100),
        water: Math.round((waterTotal / goal.water_ml) * 100),
      },
      meals,
    })
  } catch (error) {
    console.error("Error fetching daily nutrition:", error)
    return NextResponse.json(
      { error: "Failed to fetch nutrition data" },
      { status: 500 }
    )
  }
}
