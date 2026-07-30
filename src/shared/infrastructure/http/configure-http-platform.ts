import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import { HttpException, HttpStatus } from '@nestjs/common'
import type { NestFastifyApplication } from '@nestjs/platform-fastify'

import type { ApplicationConfig } from '../config/environment.schema'

export async function configureHttpPlatform(
  application: NestFastifyApplication,
  config: ApplicationConfig,
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
}
