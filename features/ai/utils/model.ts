import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";

/** Default OpenAI model used when a conversation has no model override. */
export const DEFAULT_CHAT_MODEL = "gemini-3.5-flash";

export const SUPPORTED_MODELS = [
  { id: "gemini-3.5-flash", name: "Gemini 3.5 Flash", description: "Default high-performance model" },
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", description: "Fastest and most responsive model" },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", description: "Advanced reasoning for complex tasks" },
  { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", description: "Lightweight and efficient model" },
  { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", description: "Enhanced reasoning and larger context" },
] as const;

/**
 * Returns an OpenAI language model instance for chat completions.
 *
 * @param modelId - Optional model identifier; falls back to {@link DEFAULT_CHAT_MODEL}.
 */
export function getChatModel(modelId?: string | null) {
    return google(modelId || DEFAULT_CHAT_MODEL)
}