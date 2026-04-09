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
  private async listModels(apiVersion: 'v1' | 'v1beta'): Promise<string[]> {
    const endpoint = `https://generativelanguage.googleapis.com/${apiVersion}/models?key=${encodeURIComponent(config.AI_API_KEY)}`
    const response = await fetch(endpoint, { method: 'GET' })
    if (!response.ok) {
      return []
    }

    const json = (await response.json()) as {
      models?: Array<{ name?: string; supportedGenerationMethods?: string[] }>
    }

    return (
      json.models
        ?.filter((model) => (model.supportedGenerationMethods ?? []).includes('generateContent'))
        .map((model) => (model.name ?? '').replace(/^models\//, ''))
        .filter(Boolean) ?? []
    )
  }

  private async generateWithModel(
    apiVersion: 'v1' | 'v1beta',
    model: string,
    input: GenerateTextInput,
  ): Promise<GenerateTextOutput | null> {
    const endpoint = `https://generativelanguage.googleapis.com/${apiVersion}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(config.AI_API_KEY)}`

    const mergedPrompt = `${input.systemPrompt ?? defaultSystemPrompt}\n\nUser request:\n${input.prompt}`

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: mergedPrompt }],
          },
        ],
        generationConfig: {
          temperature: 0.4,
        },
      }),
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      const payload = await response.text()
      throw new PublicError(
        `Gemini API error (${response.status}): ${payload.slice(0, 240)}`,
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

  async generateText(input: GenerateTextInput): Promise<GenerateTextOutput> {
    const fixedCandidates = [config.AI_MODEL, 'gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash']
    const v1Models = await this.listModels('v1')
    const v1betaModels = await this.listModels('v1beta')
    const dynamicCandidates = [...v1Models, ...v1betaModels]
    const candidateModels = Array.from(new Set([...fixedCandidates, ...dynamicCandidates]))

    // Prefer likely fast models first when dynamically discovered.
    candidateModels.sort((a, b) => {
      const score = (name: string) => (name.includes('flash') ? 0 : 1)
      return score(a) - score(b)
    })

    for (const apiVersion of ['v1', 'v1beta'] as const) {
      for (const model of candidateModels) {
        const result = await this.generateWithModel(apiVersion, model, input)
        if (result) {
          return result
        }
      }
    }

    throw new PublicError(
      `Gemini model unavailable for this key. Tried ${candidateModels.length} models across v1/v1beta. Please verify AI Studio key permissions or switch to AI_PROVIDER=openai.`,
      400,
    )
  }
}

export function createProvider(): AIProvider {
  if (config.AI_PROVIDER === 'openai') {
    return new OpenAIProvider()
  }
  return new GeminiProvider()
}
