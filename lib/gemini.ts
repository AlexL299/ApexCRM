import { GoogleGenAI } from '@google/genai'

if (!process.env.GEMINI_API_KEY) {
  throw new Error('Missing GEMINI_API_KEY environment variable')
}

// Singleton Gemini client (server-only — never import from client components)
export const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

// Model hierarchy: verified fast and reliable models with fallback
export const CANDIDATE_MODELS = [
  'gemini-3.5-flash',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
]

/**
 * Call Gemini with automatic fallback across models.
 */
export async function generateText(prompt: string): Promise<string> {
  let lastError: unknown

  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await genai.models.generateContent({
        model,
        contents: prompt,
      })
      if (response.text) return response.text
    } catch (err) {
      console.warn(`[Gemini] Model ${model} failed, trying fallback...`, err)
      lastError = err
    }
  }

  throw lastError ?? new Error('All Gemini candidate models failed')
}

/**
 * Call Gemini with a JSON-mode prompt and parse the result.
 * Includes markdown fence stripping and model fallback.
 */
export async function generateJSON<T>(prompt: string): Promise<T> {
  let lastError: unknown

  for (const model of CANDIDATE_MODELS) {
    try {
      const response = await genai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      })

      let text = response.text?.trim() ?? '{}'
      // Strip potential ```json ... ``` wrappers if present
      if (text.startsWith('```json')) {
        text = text.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      } else if (text.startsWith('```')) {
        text = text.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }

      return JSON.parse(text) as T
    } catch (err) {
      console.warn(`[Gemini JSON] Model ${model} failed, trying fallback...`, err)
      lastError = err
    }
  }

  throw lastError ?? new Error('All Gemini candidate models failed')
}
