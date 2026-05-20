import { openai } from "@ai-sdk/openai"
import { anthropic } from "@ai-sdk/anthropic"
import { xai } from "@ai-sdk/xai"
import type { LanguageModel } from "ai"

export type AIProvider = "openai" | "anthropic" | "xai"

// Default models per provider — override via AI_TEXT_MODEL / AI_VISION_MODEL env vars
const DEFAULT_TEXT_MODELS: Record<AIProvider, string> = {
  openai: "gpt-4o-mini",
  anthropic: "claude-3-5-haiku-20241022",
  xai: "grok-2-1212",
}

const DEFAULT_VISION_MODELS: Record<AIProvider, string> = {
  openai: "gpt-4o",
  anthropic: "claude-3-5-sonnet-20241022",
  xai: "grok-2-vision-1212",
}

function resolveProvider(): AIProvider {
  const p = (process.env.AI_PROVIDER ?? "openai").toLowerCase()
  if (p === "openai" || p === "anthropic" || p === "xai") return p
  throw new Error(`Unknown AI_PROVIDER "${p}". Valid values: openai | anthropic | xai`)
}

function buildModel(provider: AIProvider, modelId: string): LanguageModel {
  switch (provider) {
    case "openai":
      return openai(modelId)
    case "anthropic":
      return anthropic(modelId)
    case "xai":
      return xai(modelId)
  }
}

/** Returns the model used for text-based nutrition parsing (fast, cheap). */
export function getTextModel(): LanguageModel {
  const provider = resolveProvider()
  const modelId = process.env.AI_TEXT_MODEL ?? DEFAULT_TEXT_MODELS[provider]
  return buildModel(provider, modelId)
}

/** Returns the model used for image-based nutrition parsing (vision-capable). */
export function getVisionModel(): LanguageModel {
  const provider = resolveProvider()
  const modelId = process.env.AI_VISION_MODEL ?? DEFAULT_VISION_MODELS[provider]
  return buildModel(provider, modelId)
}

/** Returns the provider label used for tagging parse results. */
export function getProviderLabel(): AIProvider {
  return resolveProvider()
}
