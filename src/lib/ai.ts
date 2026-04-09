import { apiFetch } from './apiClient'
import type { InstantAppPreview } from './mockInstantApp'

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

type GenerateJitUiResponse = {
  success: boolean
  data: {
    preview: InstantAppPreview
    model: string
    provider: 'openai' | 'gemini'
  }
}

/** 由后端 LLM 理解口述并返回可渲染的 JIT 界面 JSON（失败时请在调用方回退到本地规则） */
export async function generateJitUiFromPrompt(prompt: string): Promise<{
  preview: InstantAppPreview
  model: string
  provider: 'openai' | 'gemini'
}> {
  const response = await apiFetch<GenerateJitUiResponse>('/v1/ai/jit-ui', {
    method: 'POST',
    body: JSON.stringify({ prompt }),
  })
  return {
    preview: response.data.preview,
    model: response.data.model,
    provider: response.data.provider,
  }
}
