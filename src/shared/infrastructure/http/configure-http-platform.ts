import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import { HttpException, HttpStatus } from '@nestjs/common'
import type { NestFastifyApplication } from '@nestjs/platform-fastify'

import type { ApplicationConfig } from '../config/environment.schema'
import type { AsyncLocalRequestContext } from '../observability/async-local-request-context'

export async function configureHttpPlatform(
  application: NestFastifyApplication,
  config: ApplicationConfig,
  requestContext: AsyncLocalRequestContext,
): Promise<void> {
  await application.register(cors, {
    credentials: true,
    origin: [...config.cors.origins],
  })
  await application.register(helmet)
  await application.register(rateLimit, {
    global: true,
    max: config.rateLimit.max,
    timeWindow: config.rateLimit.windowSeconds * 1000,
    errorResponseBuilder: () =>
      new HttpException(
        {
          code: 'request.rate_limit_exceeded',
          detail: 'Request rate limit exceeded',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      ),
  })

  const fastify = application.getHttpAdapter().getInstance()

  fastify.addHook('onRequest', (request, reply, done) => {
    reply.header('x-request-id', request.id)
    requestContext.run(request.id, done)
  })
  fastify.addHook('onResponse', (request, reply, done) => {
    request.log.info(
      {
        event: 'http.request.completed',
        requestId: request.id,
        method: request.method,
        route: request.routeOptions.url,
        status: reply.statusCode,
        durationMs: reply.elapsedTime,
      },
      'Request completed',
    )
    done()
  })
}
