import { randomBytes } from 'node:crypto'

import { DocumentBuilder, type OpenAPIObject, SwaggerModule } from '@nestjs/swagger'
import type { NestFastifyApplication } from '@nestjs/platform-fastify'

import type { ApplicationConfig } from '../config/environment.schema'

export const OPENAPI_TITLE = 'NestJS Hexagonal Boilerplate API'
export const OPENAPI_VERSION = '1.0.0'
export const OPENAPI_BEARER_SCHEME = 'bearerAuth'

type ScalarModule = typeof import('@scalar/fastify-api-reference')

async function loadScalarApiReference(): Promise<ScalarModule['default']> {
  // TypeScript rewrites import() to require() in CommonJS output. The Function boundary preserves
  // Node's native ESM loader for Scalar, whose current Fastify package is ESM-only.
  // eslint-disable-next-line @typescript-eslint/no-implied-eval -- required ESM bridge in CommonJS output
  const nativeImport = Function('specifier', 'return import(specifier)') as (
    specifier: string,
  ) => Promise<ScalarModule>
  const scalar = await nativeImport('@scalar/fastify-api-reference')

  return scalar.default
}

export function createOpenApiDocument(application: NestFastifyApplication): OpenAPIObject {
  const configuration = new DocumentBuilder()
    .setTitle(OPENAPI_TITLE)
    .setDescription(
      'Production-oriented NestJS and Fastify boilerplate with identity, organizations and audit trails.',
    )
    .setVersion(OPENAPI_VERSION)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Short-lived access token returned by the login or refresh operation.',
      },
      OPENAPI_BEARER_SCHEME,
    )
    .addTag('Authentication', 'Registration, login and renewable session operations')
    .addTag('Users', 'Current user profile operations')
    .addTag('Organizations', 'Organization and membership administration')
    .addTag('Audit', 'Tenant-scoped audit event retrieval')
    .build()

  return SwaggerModule.createDocument(application, configuration, {
    operationIdFactory: (controllerKey: string, methodKey: string): string =>
      `${controllerKey}_${methodKey}`,
  })
}

export async function configureApiDocumentation(
  application: NestFastifyApplication,
  config: ApplicationConfig,
): Promise<OpenAPIObject | null> {
  if (!config.documentation.enabled) {
    return null
  }

  const document = createOpenApiDocument(application)
  const fastify = application.getHttpAdapter().getInstance()
  const scalarApiReference = await loadScalarApiReference()
  const scalarNonce = randomBytes(16).toString('base64')
  const scalarContentSecurityPolicy = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${scalarNonce}'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
  ].join('; ')

  fastify.get(config.documentation.openApiPath, async (_request, reply) =>
    reply.type('application/json').send(document),
  )
  await fastify.register(scalarApiReference, {
    routePrefix: config.documentation.referencePath as `/${string}`,
    configuration: {
      title: `${OPENAPI_TITLE} Reference`,
      url: config.documentation.openApiPath,
      nonce: scalarNonce,
      withDefaultFonts: false,
    },
    hooks: {
      preHandler: (_request, reply, done): void => {
        reply.header('Content-Security-Policy', scalarContentSecurityPolicy)
        done()
      },
    },
  })

  return document
}
