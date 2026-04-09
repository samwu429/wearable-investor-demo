import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  AI_PROVIDER: z.enum(['openai', 'gemini']).default('gemini'),
  AI_API_KEY: z.string().min(1, 'AI_API_KEY is required'),
  AI_MODEL: z.string().min(1).default('gemini-1.5-flash'),
  ALLOWED_ORIGINS: z.string().default('https://samwu429.github.io'),
  API_RATE_LIMIT_PER_MIN: z.coerce.number().int().positive().default(30),
})

const parsed = envSchema.safeParse(process.env)
if (!parsed.success) {
  const message = parsed.error.issues.map((issue) => issue.message).join('; ')
  throw new Error(`Invalid environment configuration: ${message}`)
}

export const config = {
  ...parsed.data,
  allowedOrigins: parsed.data.ALLOWED_ORIGINS.split(',').map((item) => item.trim()).filter(Boolean),
}
