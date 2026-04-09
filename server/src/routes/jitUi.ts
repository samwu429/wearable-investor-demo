import type { FastifyPluginAsync } from 'fastify'
import { z } from 'zod'
import { createProvider } from '../lib/provider.js'
import { JIT_UI_SYSTEM_PROMPT, parseJitUiPayload } from '../lib/jitUiSchema.js'
import { PublicError } from '../lib/errors.js'

const requestSchema = z.object({
  prompt: z.string().min(2).max(2000),
})

export const jitUiRoutes: FastifyPluginAsync = async (app) => {
  const provider = createProvider()

  app.post('/v1/ai/jit-ui', async (request, reply) => {
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

    const { prompt } = parsed.data

    const result = await provider.generateText({
      systemPrompt: JIT_UI_SYSTEM_PROMPT,
      prompt: `用户口述：\n"""\n${prompt}\n"""`,
      jsonObject: true,
    })

    try {
      const preview = parseJitUiPayload(result.text)
      return {
        success: true,
        data: {
          preview,
          model: result.model,
          provider: result.provider,
        },
      }
    } catch (e) {
      request.log.warn({ err: e, snippet: result.text.slice(0, 400) }, 'jit-ui json parse failed')
      throw new PublicError('模型返回的界面 JSON 无法解析，请换种说法重试', 502)
    }
  })
}
