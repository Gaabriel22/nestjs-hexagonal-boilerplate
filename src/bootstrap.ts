import { type Type, ValidationPipe, VersioningType } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify'

import { AppModule } from './app.module'
import { applicationConfig } from './shared/infrastructure/config/application-config'
import { ProblemDetailsFilter } from './shared/infrastructure/http/problem-details.filter'
import { configureHttpPlatform } from './shared/infrastructure/http/configure-http-platform'
import { createValidationException } from './shared/infrastructure/http/request-validation'

export async function createApplication(
  rootModule: Type = AppModule,
): Promise<NestFastifyApplication> {
  const application = await NestFactory.create<NestFastifyApplication>(
    rootModule,
    new FastifyAdapter({
      bodyLimit: applicationConfig.http.bodyLimitBytes,
    }),
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
  await configureHttpPlatform(application, applicationConfig)

  return application
}
