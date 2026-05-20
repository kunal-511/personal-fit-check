import { generateObject, generateText } from "ai"
import { z } from "zod"
import { getTextModel, getVisionModel, getProviderLabel } from "./providers"
import { NUTRITION_SYSTEM_PROMPT, NUTRITION_IMAGE_PROMPT, VISION_DESCRIBE_PROMPT } from "./prompts"
import type { ParsedFood, ParseResult } from "@/types"

// ---------------------------------------------------------------------------
// Zod schema — constrains AI output to a validated shape (no manual JSON parsing)
// ---------------------------------------------------------------------------

const FoodSchema = z.object({
  name: z.string().describe("Food item name, properly capitalized"),
  quantity: z.number().positive().describe("Numeric amount of the food"),
  unit: z.string().describe("Unit: g, ml, serving, piece, cup, tbsp, etc."),
  calories: z.number().min(0).describe("Total calories for the given quantity"),
  protein: z.number().min(0).describe("Total protein in grams for the given quantity"),
  carbs: z.number().min(0).describe("Total carbohydrates in grams for the given quantity"),
  fats: z.number().min(0).describe("Total fats in grams for the given quantity"),
  fiber: z.number().min(0).nullable().describe("Total dietary fiber in grams, or null if unknown"),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe("Confidence score: 0.95 for well-known foods, 0.8 for estimates, 0.6 for guesses"),
})

const ParseSchema = z.object({
  foods: z.array(FoodSchema).min(1),
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildTotals(foods: ParsedFood[]) {
  const totals = foods.reduce(
    (acc, f) => ({
      calories: acc.calories + f.calories,
      protein: acc.protein + f.protein,
      carbs: acc.carbs + f.carbs,
      fats: acc.fats + f.fats,
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  )
  return {
    calories: Math.round(totals.calories),
    protein: Math.round(totals.protein * 10) / 10,
    carbs: Math.round(totals.carbs * 10) / 10,
    fats: Math.round(totals.fats * 10) / 10,
  }
}

// ---------------------------------------------------------------------------
// Text parser — uses gpt-4o-mini (fast + cheap)
// ---------------------------------------------------------------------------

export async function parseFromText(text: string): Promise<ParseResult> {
  const provider = getProviderLabel()

  try {
    const { object } = await generateObject({
      model: getTextModel(),
      schema: ParseSchema,
      system: NUTRITION_SYSTEM_PROMPT,
      prompt: text,
    })

    const foods: ParsedFood[] = object.foods.map((f) => ({
      name: f.name,
      quantity: f.quantity,
      unit: f.unit,
      calories: f.calories,
      protein: f.protein,
      carbs: f.carbs,
      fats: f.fats,
      fiber: f.fiber ?? undefined,
      confidence: f.confidence,
    }))

    return {
      success: true,
      foods,
      totals: buildTotals(foods),
      parsed_text: text,
      source: `${provider}-text` as ParseResult["source"],
    }
  } catch (error) {
    console.error("AI text parse failed:", error)
    return {
      success: false,
      foods: [],
      source: `${provider}-text` as ParseResult["source"],
      message: error instanceof Error ? error.message : "AI parsing failed",
    }
  }
}

// ---------------------------------------------------------------------------
// Image parser — two-step pipeline for maximum accuracy
//
// Step 1: gpt-4o (vision, unconstrained generateText) freely describes every
//         food item and estimated portion — no JSON schema to cut it short.
// Step 2: gpt-4o-mini (generateObject + Zod) converts that description into
//         validated structured nutrition data.
// ---------------------------------------------------------------------------

export async function parseFromImage(
  imageData: string,
  mimeType: string
): Promise<ParseResult> {
  const provider = getProviderLabel()

  // imageData can be a base64 data URL (data:image/jpeg;base64,...) or raw base64
  const base64 = imageData.startsWith("data:")
    ? imageData.split(",")[1]
    : imageData

  try {
    // Step 1 — vision model describes everything it sees, completely unconstrained
    const { text: description } = await generateText({
      model: getVisionModel(),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              image: base64,
              mediaType: mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
            },
            {
              type: "text",
              text: VISION_DESCRIBE_PROMPT,
            },
          ],
        },
      ],
    })

    if (!description?.trim()) {
      throw new Error("Vision model returned an empty description")
    }

    // Step 2 — text model converts the free-form description into structured nutrition
    const { object } = await generateObject({
      model: getTextModel(),
      schema: ParseSchema,
      system: NUTRITION_SYSTEM_PROMPT,
      prompt: `${NUTRITION_IMAGE_PROMPT}\n\nFood description from image:\n${description}`,
    })

    const foods: ParsedFood[] = object.foods.map((f) => ({
      name: f.name,
      quantity: f.quantity,
      unit: f.unit,
      calories: f.calories,
      protein: f.protein,
      carbs: f.carbs,
      fats: f.fats,
      fiber: f.fiber ?? undefined,
      confidence: f.confidence,
    }))

    return {
      success: true,
      foods,
      totals: buildTotals(foods),
      source: `${provider}-vision` as ParseResult["source"],
    }
  } catch (error) {
    console.error("AI image parse failed:", error)
    return {
      success: false,
      foods: [],
      source: `${provider}-vision` as ParseResult["source"],
      message: error instanceof Error ? error.message : "AI image parsing failed",
    }
  }
}
