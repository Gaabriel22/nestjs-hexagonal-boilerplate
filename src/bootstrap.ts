import { type Type, ValidationPipe, VersioningType } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify'
import { LogController } from 'fastify'
import type { IncomingMessage } from 'node:http'
import type { Http2ServerRequest } from 'node:http2'
import type { DestinationStream } from 'pino'

import { AppModule } from './app.module'
import { applicationConfig } from './shared/infrastructure/config/application-config'
import type { ApplicationConfig } from './shared/infrastructure/config/environment.schema'
import { configureApiDocumentation } from './shared/infrastructure/http/configure-api-documentation'
import { ProblemDetailsFilter } from './shared/infrastructure/http/problem-details.filter'
import { configureHttpPlatform } from './shared/infrastructure/http/configure-http-platform'
import { createValidationException } from './shared/infrastructure/http/request-validation'
import { requestContextStorage } from './shared/infrastructure/observability/request-context.module'
import { resolveRequestIdentifier } from './shared/infrastructure/observability/request-identifier'
import { createStructuredLogger } from './shared/infrastructure/observability/structured-logger'

export interface ApplicationCreationOptions {
  readonly loggerDestination?: DestinationStream
}

export async function createApplication(
  rootModule: Type = AppModule,
  config: ApplicationConfig = applicationConfig,
  options: ApplicationCreationOptions = {},
): Promise<NestFastifyApplication> {
  const structuredLogger = createStructuredLogger(config, options.loggerDestination)
  const application = await NestFactory.create<NestFastifyApplication>(
    rootModule,
    new FastifyAdapter({
      bodyLimit: config.http.bodyLimitBytes,
      genReqId: (request: IncomingMessage | Http2ServerRequest): string =>
        resolveRequestIdentifier(request.headers['x-request-id']),
      logController: new LogController({
        disableRequestLogging: true,
        requestIdLogLabel: 'requestId',
      }),
      loggerInstance: structuredLogger.logger,
    }),
    { logger: structuredLogger.nestLogger },
  )

  application.enableShutdownHooks()
  application.setGlobalPrefix('api')
  application.enableVersioning({
    defaultVersion: '1',
    type: VersioningType.URI,
  })
  application.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: createValidationException,
      forbidNonWhitelisted: true,
      stopAtFirstError: false,
      transform: true,
      transformOptions: {
        enableImplicitConversion: false,
      },
      validationError: {
        target: false,
        value: false,
      },
      whitelist: true,
    }),
  )
  application.useGlobalFilters(new ProblemDetailsFilter())
  await configureHttpPlatform(application, config, requestContextStorage)
  await configureApiDocumentation(application, config)

  return application
}
