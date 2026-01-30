import { NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

// Cloudflare AI Configuration (Free tier: 10,000 neurons/day)
// Get your credentials at: https://dash.cloudflare.com/ -> AI -> Workers AI
const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || ""
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || ""
const CF_AI_MODEL = "@cf/meta/llama-3.1-8b-instruct" // Free tier model
const USER_ID = "default_user"

interface ParsedFood {
  name: string
  quantity: number
  unit: string
  calories: number
  protein: number
  carbs: number
  fats: number
  confidence: number
}

// Call Cloudflare Workers AI
async function callCloudflareAI(prompt: string): Promise<string | null> {
  if (!CF_ACCOUNT_ID || !CF_API_TOKEN) {
    console.log("Cloudflare AI credentials not configured")
    return null
  }

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/${CF_AI_MODEL}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${CF_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: `You are a nutrition expert assistant. When given a food description, extract the food items and estimate their nutritional values per serving.

IMPORTANT: You must respond ONLY with valid JSON, no other text. Use this exact format:
{
  "foods": [
    {
      "name": "Food Name",
      "quantity": 1,
      "unit": "g or serving or piece",
      "calories": 0,
      "protein": 0,
      "carbs": 0,
      "fats": 0
    }
  ]
}

Nutritional values should be realistic estimates based on common food databases. All numbers should be integers or decimals (no strings). If quantity is in grams, calculate nutrition for that amount. If no quantity specified, assume a typical serving size.`,
            },
            {
              role: "user",
              content: `Parse this food description and return nutritional estimates as JSON: "${prompt}"`,
            },
          ],
          max_tokens: 1000,
          temperature: 0.3, // Lower temperature for more consistent output
        }),
      }
    )

    if (!response.ok) {
      const error = await response.text()
      console.error("Cloudflare AI error:", error)
      return null
    }

    const data = await response.json()
    return data.result?.response || null
  } catch (error) {
    console.error("Cloudflare AI request failed:", error)
    return null
  }
}

// Parse AI response to extract JSON
function parseAIResponse(response: string): ParsedFood[] | null {
  try {
    // Try to find JSON in the response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    const parsed = JSON.parse(jsonMatch[0])

    if (!parsed.foods || !Array.isArray(parsed.foods)) {
      return null
    }

    return parsed.foods.map((food: Record<string, unknown>) => {
      const quantity = Number(food.quantity) || 1
      const calories = Number(food.calories) || 0
      const protein = Number(food.protein) || 0
      const carbs = Number(food.carbs) || 0
      const fats = Number(food.fats) || 0
      const perUnit = quantity > 0 ? quantity : 1

      return {
        name: String(food.name || "Unknown"),
        quantity,
        unit: String(food.unit || "serving"),
        calories: Math.round((calories / perUnit) * 100) / 100,
        protein: Math.round((protein / perUnit) * 100) / 100,
        carbs: Math.round((carbs / perUnit) * 100) / 100,
        fats: Math.round((fats / perUnit) * 100) / 100,
        confidence: 0.85,
      }
    })
  } catch (error) {
    console.error("Failed to parse AI response:", error)
    return null
  }
}

// Fallback: Simple keyword-based parsing when AI is not available
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

  const foodDatabase: Record<string, { calories: number; protein: number; carbs: number; fats: number; defaultAmount: number; unit: string }> = {}
  const rows = frequentFoods as unknown as Array<{
    food_name: string
    unit: string
    calories: number
    protein_g: number
    carbs_g: number
    fats_g: number
  }>

  for (const row of rows) {
    foodDatabase[row.food_name.toLowerCase()] = {
      calories: Number(row.calories) || 0,
      protein: Number(row.protein_g) || 0,
      carbs: Number(row.carbs_g) || 0,
      fats: Number(row.fats_g) || 0,
      defaultAmount: 1,
      unit: row.unit || "serving",
    }
  }

  // Split by common separators
  const parts = text.split(/(?:,|and|with|\+|&|\n)/i).map(p => p.trim()).filter(Boolean)

  for (const part of parts) {
    // Try to extract quantity
    const quantityMatch = part.match(/(\d+(?:\.\d+)?)\s*(?:g|grams?|ml|cups?|tbsp|pieces?|slices?|servings?|large|medium|small)?\s*/i)
    const quantity = quantityMatch ? parseFloat(quantityMatch[1]) : 1
    let unit = "serving"

    if (part.match(/\d+\s*g(?:rams?)?/i)) unit = "g"
    else if (part.match(/\d+\s*ml/i)) unit = "ml"
    else if (part.match(/\d+\s*cups?/i)) unit = "cup"
    else if (part.match(/\d+\s*tbsp/i)) unit = "tbsp"
    else if (part.match(/\d+\s*slices?/i)) unit = "slice"

    // Find matching food
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

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json()

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 })
    }

    let foods: ParsedFood[] = []
    let source = "fallback"

    // Try Cloudflare AI first
    if (CF_ACCOUNT_ID && CF_API_TOKEN) {
      const aiResponse = await callCloudflareAI(text)
      if (aiResponse) {
        const parsedFoods = parseAIResponse(aiResponse)
        if (parsedFoods && parsedFoods.length > 0) {
          foods = parsedFoods
          source = "cloudflare-ai"
        }
      }
    }

    // Fallback to keyword matching if AI didn't work
    if (foods.length === 0) {
      foods = await fallbackParse(text)
      source = "fallback"
    }

    if (foods.length === 0) {
      return NextResponse.json({
        success: false,
        message: "Could not identify any foods. Try being more specific, e.g., '200g chicken breast with 100g rice'",
        foods: [],
        source,
      })
    }

    // Calculate totals
    const totals = foods.reduce(
      (acc, food) => ({
        calories: acc.calories + food.calories * food.quantity,
        protein: acc.protein + food.protein * food.quantity,
        carbs: acc.carbs + food.carbs * food.quantity,
        fats: acc.fats + food.fats * food.quantity,
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    )

    // Round totals
    totals.protein = Math.round(totals.protein * 10) / 10
    totals.carbs = Math.round(totals.carbs * 10) / 10
    totals.fats = Math.round(totals.fats * 10) / 10

    return NextResponse.json({
      success: true,
      foods,
      totals,
      parsed_text: text,
      source,
      ai_available: !!(CF_ACCOUNT_ID && CF_API_TOKEN),
    })
  } catch (error) {
    console.error("Error parsing food:", error)
    return NextResponse.json({ error: "Failed to parse food" }, { status: 500 })
  }
}
