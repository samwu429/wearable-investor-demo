import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { createProvider } from '../lib/provider.js'

const requestSchema = z.object({
  prompt: z.string().min(8).max(2000),
  systemPrompt: z.string().min(1).max(1000).optional(),
})

export const aiRoutes: FastifyPluginAsync = async (app) => {
  const provider = createProvider()

  app.post('/v1/ai/generate', async (request, reply) => {
    const parsed = requestSchema.safeParse(request.body)
    if (!parsed.success) {
      return reply.code(400).send({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: parsed.error.issues[0]?.message ?? 'Invalid request body',
        },
      })
    }

    const result = await provider.generateText(parsed.data)
    return {
      success: true,
      data: result,
    }
  })
}
