import { apiFetch } from './apiClient'

export type GenerateInsightInput = {
  prompt: string
  systemPrompt?: string
}

export type GenerateInsightOutput = {
  text: string
  model: string
  provider: 'openai' | 'gemini'
}

type GenerateInsightResponse = {
  success: boolean
  data: GenerateInsightOutput
}

export async function generateInsight(input: GenerateInsightInput): Promise<GenerateInsightOutput> {
  const response = await apiFetch<GenerateInsightResponse>('/v1/ai/generate', {
    method: 'POST',
    body: JSON.stringify(input),
  })
  return response.data
}
