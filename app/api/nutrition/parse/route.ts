import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { parseFromText, parseFromImage } from "@/lib/ai/nutrition-parser"
import type { ParsedFood, ParseResult } from "@/types"

const USER_ID = "default_user"

// ---------------------------------------------------------------------------
// DB fallback — keyword match against frequent_foods when AI is unavailable
// ---------------------------------------------------------------------------

async function fallbackParse(text: string): Promise<ParsedFood[]> {
  const foods: ParsedFood[] = []
  const lowerText = text.toLowerCase()

  const frequentFoods = await sql`
    SELECT food_name, unit, calories, protein_g, carbs_g, fats_g
    FROM frequent_foods
    WHERE user_id = ${USER_ID}
    ORDER BY use_count DESC, last_used_at DESC
    LIMIT 50
  `

  if (frequentFoods.length === 0) return foods

  type FoodRow = { food_name: string; unit: string; calories: number; protein_g: number; carbs_g: number; fats_g: number }
  const rows = frequentFoods as unknown as FoodRow[]

  const foodDatabase: Record<string, { calories: number; protein: number; carbs: number; fats: number; unit: string }> = {}
  for (const row of rows) {
    foodDatabase[row.food_name.toLowerCase()] = {
      calories: Number(row.calories) || 0,
      protein: Number(row.protein_g) || 0,
      carbs: Number(row.carbs_g) || 0,
      fats: Number(row.fats_g) || 0,
      unit: row.unit || "serving",
    }
  }

  const parts = text.split(/(?:,|and|with|\+|&|\n)/i).map(p => p.trim()).filter(Boolean)

  for (const part of parts) {
    const quantityMatch = part.match(/(\d+(?:\.\d+)?)\s*(?:g|grams?|ml|cups?|tbsp|pieces?|slices?|servings?|large|medium|small)?\s*/i)
    const quantity = quantityMatch ? parseFloat(quantityMatch[1]) : 1
    let unit = "serving"

    if (part.match(/\d+\s*g(?:rams?)?/i)) unit = "g"
    else if (part.match(/\d+\s*ml/i)) unit = "ml"
    else if (part.match(/\d+\s*cups?/i)) unit = "cup"
    else if (part.match(/\d+\s*tbsp/i)) unit = "tbsp"
    else if (part.match(/\d+\s*slices?/i)) unit = "slice"

    for (const [foodName, data] of Object.entries(foodDatabase)) {
      if (lowerText.includes(foodName) || part.toLowerCase().includes(foodName)) {
        let normalizedQuantity = quantity
        let normalizedUnit = unit === "serving" ? data.unit : unit

        if (unit === "g" && data.unit !== "g") {
          normalizedQuantity = quantity / 100
          normalizedUnit = data.unit
        }

        foods.push({
          name: foodName.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
          quantity: normalizedQuantity,
          unit: normalizedUnit,
          calories: Math.round(data.calories * 100) / 100,
          protein: Math.round(data.protein * 100) / 100,
          carbs: Math.round(data.carbs * 100) / 100,
          fats: Math.round(data.fats * 100) / 100,
          confidence: 0.6,
        })
        break
      }
    }
  }

  return foods
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, image, mimeType } = body as { text?: string; image?: string; mimeType?: string }

    const isImageRequest = !!image
    const isTextRequest = !!text && typeof text === "string"

    if (!isImageRequest && !isTextRequest) {
      return NextResponse.json({ error: "Provide either 'text' or 'image'" }, { status: 400 })
    }

    const openaiConfigured = !!process.env.OPENAI_API_KEY
    const anthropicConfigured = !!process.env.ANTHROPIC_API_KEY
    const xaiConfigured = !!process.env.XAI_API_KEY
    const aiConfigured = openaiConfigured || anthropicConfigured || xaiConfigured

    let result: ParseResult

    if (aiConfigured) {
      result = isImageRequest
        ? await parseFromImage(image!, mimeType || "image/jpeg")
        : await parseFromText(text!)
    } else {
      // No AI keys configured — use DB fallback for text only
      if (isImageRequest) {
        return NextResponse.json({
          success: false,
          foods: [],
          source: "fallback",
          message: "Image parsing requires an AI provider API key. Set OPENAI_API_KEY in your .env.local.",
        })
      }

      const foods = await fallbackParse(text!)
      result = {
        success: foods.length > 0,
        foods,
        source: "fallback",
        parsed_text: text,
        message: foods.length === 0
          ? "Could not identify any foods. Try being more specific, e.g., '200g chicken breast with 100g rice'"
          : undefined,
      }
    }

    // If AI returned no foods, try DB fallback for text requests
    if (!result.success && isTextRequest) {
      const fallbackFoods = await fallbackParse(text!)
      if (fallbackFoods.length > 0) {
        result = {
          success: true,
          foods: fallbackFoods,
          source: "fallback",
          parsed_text: text,
        }
      }
    }

    if (!result.success || result.foods.length === 0) {
      return NextResponse.json({
        success: false,
        foods: [],
        source: result.source,
        message: result.message || "Could not identify any foods. Try being more specific.",
      })
    }

    // Recalculate totals server-side to ensure accuracy
    const totals = result.foods.reduce(
      (acc, food) => ({
        calories: acc.calories + food.calories,
        protein: acc.protein + food.protein,
        carbs: acc.carbs + food.carbs,
        fats: acc.fats + food.fats,
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    )

    return NextResponse.json({
      success: true,
      foods: result.foods,
      totals: {
        calories: Math.round(totals.calories),
        protein: Math.round(totals.protein * 10) / 10,
        carbs: Math.round(totals.carbs * 10) / 10,
        fats: Math.round(totals.fats * 10) / 10,
      },
      parsed_text: result.parsed_text,
      source: result.source,
      ai_available: aiConfigured,
    })
  } catch (error) {
    console.error("Error parsing food:", error)
    return NextResponse.json({ error: "Failed to parse food" }, { status: 500 })
  }
}
