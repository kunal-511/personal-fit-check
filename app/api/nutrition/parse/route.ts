import { NextRequest, NextResponse } from "next/server"

// Cloudflare AI Configuration (Free tier: 10,000 neurons/day)
// Get your credentials at: https://dash.cloudflare.com/ -> AI -> Workers AI
const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || ""
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || ""
const CF_AI_MODEL = "@cf/meta/llama-3.1-8b-instruct" // Free tier model

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

    return parsed.foods.map((food: Record<string, unknown>) => ({
      name: String(food.name || "Unknown"),
      quantity: Number(food.quantity) || 1,
      unit: String(food.unit || "serving"),
      calories: Math.round(Number(food.calories) || 0),
      protein: Math.round((Number(food.protein) || 0) * 10) / 10,
      carbs: Math.round((Number(food.carbs) || 0) * 10) / 10,
      fats: Math.round((Number(food.fats) || 0) * 10) / 10,
      confidence: 0.85,
    }))
  } catch (error) {
    console.error("Failed to parse AI response:", error)
    return null
  }
}

// Fallback: Simple keyword-based parsing when AI is not available
function fallbackParse(text: string): ParsedFood[] {
  const foods: ParsedFood[] = []
  const lowerText = text.toLowerCase()

  // Common food database with approximate values
  const foodDatabase: Record<string, { calories: number; protein: number; carbs: number; fats: number; defaultAmount: number; unit: string }> = {
    "chicken breast": { calories: 165, protein: 31, carbs: 0, fats: 3.6, defaultAmount: 100, unit: "g" },
    "chicken": { calories: 165, protein: 31, carbs: 0, fats: 3.6, defaultAmount: 100, unit: "g" },
    "rice": { calories: 130, protein: 2.7, carbs: 28, fats: 0.3, defaultAmount: 100, unit: "g" },
    "eggs": { calories: 156, protein: 12, carbs: 1.2, fats: 10, defaultAmount: 2, unit: "large" },
    "egg": { calories: 78, protein: 6, carbs: 0.6, fats: 5, defaultAmount: 1, unit: "large" },
    "banana": { calories: 105, protein: 1.3, carbs: 27, fats: 0.4, defaultAmount: 1, unit: "medium" },
    "apple": { calories: 95, protein: 0.5, carbs: 25, fats: 0.3, defaultAmount: 1, unit: "medium" },
    "bread": { calories: 79, protein: 2.7, carbs: 15, fats: 1, defaultAmount: 1, unit: "slice" },
    "toast": { calories: 79, protein: 2.7, carbs: 15, fats: 1, defaultAmount: 1, unit: "slice" },
    "salmon": { calories: 208, protein: 20, carbs: 0, fats: 13, defaultAmount: 100, unit: "g" },
    "beef": { calories: 250, protein: 26, carbs: 0, fats: 15, defaultAmount: 100, unit: "g" },
    "steak": { calories: 271, protein: 26, carbs: 0, fats: 18, defaultAmount: 100, unit: "g" },
    "pasta": { calories: 131, protein: 5, carbs: 25, fats: 1.1, defaultAmount: 100, unit: "g" },
    "oatmeal": { calories: 150, protein: 5, carbs: 27, fats: 3, defaultAmount: 1, unit: "cup" },
    "oats": { calories: 150, protein: 5, carbs: 27, fats: 3, defaultAmount: 40, unit: "g" },
    "milk": { calories: 103, protein: 8, carbs: 12, fats: 2.4, defaultAmount: 1, unit: "cup" },
    "yogurt": { calories: 100, protein: 17, carbs: 6, fats: 0.7, defaultAmount: 170, unit: "g" },
    "greek yogurt": { calories: 100, protein: 17, carbs: 6, fats: 0.7, defaultAmount: 170, unit: "g" },
    "protein shake": { calories: 150, protein: 25, carbs: 5, fats: 2, defaultAmount: 1, unit: "serving" },
    "whey protein": { calories: 120, protein: 24, carbs: 3, fats: 1, defaultAmount: 1, unit: "scoop" },
    "avocado": { calories: 160, protein: 2, carbs: 9, fats: 15, defaultAmount: 0.5, unit: "whole" },
    "sweet potato": { calories: 103, protein: 2.3, carbs: 24, fats: 0.1, defaultAmount: 130, unit: "g" },
    "potato": { calories: 161, protein: 4.3, carbs: 37, fats: 0.2, defaultAmount: 1, unit: "medium" },
    "broccoli": { calories: 55, protein: 3.7, carbs: 11, fats: 0.6, defaultAmount: 150, unit: "g" },
    "salad": { calories: 20, protein: 1.5, carbs: 3.5, fats: 0.2, defaultAmount: 1, unit: "serving" },
    "almonds": { calories: 164, protein: 6, carbs: 6, fats: 14, defaultAmount: 28, unit: "g" },
    "peanut butter": { calories: 188, protein: 8, carbs: 6, fats: 16, defaultAmount: 2, unit: "tbsp" },
    "cheese": { calories: 113, protein: 7, carbs: 0.4, fats: 9, defaultAmount: 28, unit: "g" },
    "coffee": { calories: 2, protein: 0.3, carbs: 0, fats: 0, defaultAmount: 1, unit: "cup" },
  }

  // Split by common separators
  const parts = text.split(/(?:,|and|with|\+|&|\n)/i).map(p => p.trim()).filter(Boolean)

  for (const part of parts) {
    // Try to extract quantity
    const quantityMatch = part.match(/(\d+(?:\.\d+)?)\s*(?:g|grams?|ml|cups?|tbsp|pieces?|slices?|servings?|large|medium|small)?\s*/i)
    let quantity = quantityMatch ? parseFloat(quantityMatch[1]) : 1
    let unit = "serving"

    if (part.match(/\d+\s*g(?:rams?)?/i)) unit = "g"
    else if (part.match(/\d+\s*ml/i)) unit = "ml"
    else if (part.match(/\d+\s*cups?/i)) unit = "cup"
    else if (part.match(/\d+\s*tbsp/i)) unit = "tbsp"
    else if (part.match(/\d+\s*slices?/i)) unit = "slice"

    // Find matching food
    for (const [foodName, data] of Object.entries(foodDatabase)) {
      if (lowerText.includes(foodName) || part.toLowerCase().includes(foodName)) {
        // Calculate multiplier based on quantity and unit
        let multiplier = 1
        if (unit === "g" && data.unit === "g") {
          multiplier = quantity / data.defaultAmount
        } else if (unit === "g" && data.unit !== "g") {
          multiplier = quantity / 100 // Assume 100g per serving
        } else {
          multiplier = quantity / data.defaultAmount
        }

        foods.push({
          name: foodName.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
          quantity,
          unit: unit === "serving" ? data.unit : unit,
          calories: Math.round(data.calories * multiplier),
          protein: Math.round(data.protein * multiplier * 10) / 10,
          carbs: Math.round(data.carbs * multiplier * 10) / 10,
          fats: Math.round(data.fats * multiplier * 10) / 10,
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
      foods = fallbackParse(text)
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
        calories: acc.calories + food.calories,
        protein: acc.protein + food.protein,
        carbs: acc.carbs + food.carbs,
        fats: acc.fats + food.fats,
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
