import { config } from './config.js'
import { PublicError } from './errors.js'

type GenerateTextInput = {
  prompt: string
  systemPrompt?: string
}

export type GenerateTextOutput = {
  text: string
  model: string
  provider: 'openai' | 'gemini'
}

export interface AIProvider {
  generateText(input: GenerateTextInput): Promise<GenerateTextOutput>
}

const defaultSystemPrompt =
  'You are a concise AI assistant in an investor product demo. Respond in clear Chinese and keep answers practical.'

class OpenAIProvider implements AIProvider {
  async generateText(input: GenerateTextInput): Promise<GenerateTextOutput> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${config.AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: config.AI_MODEL,
        messages: [
          { role: 'system', content: input.systemPrompt ?? defaultSystemPrompt },
          { role: 'user', content: input.prompt },
        ],
        temperature: 0.4,
      }),
    })

    if (!response.ok) {
      const payload = await response.text()
      throw new PublicError(
        `OpenAI API error (${response.status}): ${payload.slice(0, 240)}`,
        response.status >= 500 ? 502 : 400,
      )
    }

    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>
      model?: string
    }

    const text = json.choices?.[0]?.message?.content?.trim()
    if (!text) {
      throw new PublicError('OpenAI response did not include text content', 502)
    }

    return {
      text,
      model: json.model ?? config.AI_MODEL,
      provider: 'openai',
    }
  }
}

class GeminiProvider implements AIProvider {
  async generateText(input: GenerateTextInput): Promise<GenerateTextOutput> {
    const candidateModels = [config.AI_MODEL, 'gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash']
    let lastPayload = ''
    let lastStatus = 500

    for (const model of candidateModels) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(config.AI_API_KEY)}`

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: input.systemPrompt ?? defaultSystemPrompt }],
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: input.prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.4,
          },
        }),
      })

      if (!response.ok) {
        lastStatus = response.status
        lastPayload = await response.text()
        // Model not found/unsupported, try next candidate.
        if (response.status === 404) {
          continue
        }
        throw new PublicError(
          `Gemini API error (${response.status}): ${lastPayload.slice(0, 240)}`,
          response.status >= 500 ? 502 : 400,
        )
      }

      const json = (await response.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
        modelVersion?: string
      }
      const text = json.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('').trim()

      if (!text) {
        throw new PublicError(
          'Gemini did not return text content. Check model availability, safety policy, and API key permissions.',
          502,
        )
      }

      return {
        text,
        model: json.modelVersion ?? model,
        provider: 'gemini',
      }
    }

    throw new PublicError(
      `Gemini model unavailable for this key. Tried: ${candidateModels.join(', ')}. Last error (${lastStatus}): ${lastPayload.slice(0, 180)}`,
      lastStatus >= 500 ? 502 : 400,
    )
  }
}

export function createProvider(): AIProvider {
  if (config.AI_PROVIDER === 'openai') {
    return new OpenAIProvider()
  }
  return new GeminiProvider()
}
