import Fastify from 'fastify'
import cors from '@fastify/cors'
import rateLimit from '@fastify/rate-limit'
import { randomUUID } from 'node:crypto'
import { config } from './lib/config.js'
import { healthRoutes } from './routes/health.js'
import { aiRoutes } from './routes/ai.js'
import { jitUiRoutes } from './routes/jitUi.js'

const app = Fastify({
  logger: true,
  genReqId: () => randomUUID(),
})

await app.register(cors, {
  origin(origin, cb) {
    // Allow direct probes (curl, uptime monitor) with no Origin header.
    if (!origin) {
      cb(null, true)
      return
    }
    cb(null, config.allowedOrigins.includes(origin))
  },
})

await app.register(rateLimit, {
  max: config.API_RATE_LIMIT_PER_MIN,
  timeWindow: '1 minute',
})

app.setErrorHandler((error, request, reply) => {
  request.log.error({ err: error }, 'request failed')
  const requestId = request.id
  const maybeError = error as { statusCode?: number; message?: string; name?: string }
  const statusCode = maybeError.statusCode ?? 500
  const isPublicError = maybeError.name === 'PublicError'
  const message =
    statusCode < 500 || isPublicError
      ? (maybeError.message ?? 'Request error')
      : 'Internal server error'
  reply.code(statusCode).send({
    success: false,
    error: {
      code: statusCode < 500 || isPublicError ? 'REQUEST_ERROR' : 'INTERNAL_ERROR',
      message,
      requestId,
    },
  })
})

await app.register(healthRoutes)
await app.register(aiRoutes)
await app.register(jitUiRoutes)

await app.listen({ port: config.PORT, host: '0.0.0.0' })
