import type { NestFastifyApplication } from '@nestjs/platform-fastify'
import type { OpenAPIObject } from '@nestjs/swagger'

import { installTestEnvironment } from '../../support/test-environment'

type OperationObject = NonNullable<OpenAPIObject['paths'][string]['get']>
type HttpMethod = 'get' | 'post' | 'patch' | 'delete'
type DocumentationModule =
  typeof import('../../../src/shared/infrastructure/http/configure-api-documentation')

describe('OpenAPI document', () => {
  let application: NestFastifyApplication
  let document: OpenAPIObject
  let documentation: DocumentationModule
  let restoreEnvironment: () => void

  beforeAll(async () => {
    restoreEnvironment = installTestEnvironment()
    const bootstrap = await import('../../../src/bootstrap')
    documentation =
      await import('../../../src/shared/infrastructure/http/configure-api-documentation')
    application = await bootstrap.createApplication(undefined, undefined, {
      loggerDestination: { write: (): void => undefined },
    })
    document = documentation.createOpenApiDocument(application)
  })

  afterAll(async () => {
    await application.close()
    restoreEnvironment()
  })

  it('publishes metadata, tags and the JWT bearer scheme', () => {
    expect(document.info).toMatchObject({
      title: documentation.OPENAPI_TITLE,
      version: documentation.OPENAPI_VERSION,
    })
    expect(document.tags?.map(({ name }) => name)).toEqual([
      'Authentication',
      'Users',
      'Organizations',
      'Audit',
    ])
    expect(
      document.components?.securitySchemes?.[documentation.OPENAPI_BEARER_SCHEME],
    ).toMatchObject({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    })
  })

  it('contains every public operation under the versioned API prefix', () => {
    const requiredOperations: readonly (readonly [string, HttpMethod])[] = [
      ['/api/v1/auth/register', 'post'],
      ['/api/v1/auth/login', 'post'],
      ['/api/v1/auth/refresh', 'post'],
      ['/api/v1/auth/logout', 'post'],
      ['/api/v1/auth/sessions', 'get'],
      ['/api/v1/auth/sessions/{sessionId}', 'delete'],
      ['/api/v1/users/me', 'get'],
      ['/api/v1/users/me', 'patch'],
      ['/api/v1/organizations', 'post'],
      ['/api/v1/organizations/{organizationId}/memberships', 'get'],
      ['/api/v1/organizations/{organizationId}/memberships/{membershipId}/role', 'patch'],
      ['/api/v1/organizations/{organizationId}/memberships/{membershipId}', 'delete'],
      ['/api/v1/organizations/{organizationId}/audit-events', 'get'],
    ]

    for (const [path, method] of requiredOperations) {
      const registeredOperation = operation(path, method)

      expect(typeof registeredOperation.summary).toBe('string')
      expect(registeredOperation.tags?.length).toBeGreaterThan(0)
      expect(registeredOperation.responses['400']).toBeDefined()
      expect(registeredOperation.responses['429']).toBeDefined()
      expect(registeredOperation.responses['500']).toBeDefined()
    }
  })

  it('describes request, success and Problem Details schemas', () => {
    const register = operation('/api/v1/auth/register', 'post')
    const audit = operation('/api/v1/organizations/{organizationId}/audit-events', 'get')

    expect(register.requestBody).toMatchObject({
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/RegisterUserDto' },
        },
      },
    })
    expect(register.responses['201']).toMatchObject({
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/RegisteredUserResponse' },
        },
      },
    })
    expect(register.responses['400']).toMatchObject({
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/ProblemDetails' },
        },
      },
    })
    expect(audit.responses['200']).toMatchObject({
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/AuditEventListResponse' },
        },
      },
    })
    expect(document.components?.schemas?.RegisterUserDto).toMatchObject({
      required: ['email', 'password'],
      properties: {
        email: { format: 'email', maxLength: 254 },
        password: { writeOnly: true },
      },
    })
    expect(document.components?.schemas?.ProblemDetails).toMatchObject({
      required: ['type', 'title', 'status', 'detail', 'instance', 'code'],
    })
  })

  it('declares bearer security only on protected operations', () => {
    expect(operation('/api/v1/auth/register', 'post').security).toBeUndefined()
    expect(operation('/api/v1/auth/login', 'post').security).toBeUndefined()
    expect(operation('/api/v1/auth/refresh', 'post').security).toBeUndefined()

    for (const [path, method] of [
      ['/api/v1/auth/logout', 'post'],
      ['/api/v1/auth/sessions', 'get'],
      ['/api/v1/users/me', 'get'],
      ['/api/v1/organizations', 'post'],
      ['/api/v1/organizations/{organizationId}/audit-events', 'get'],
    ] as const) {
      expect(operation(path, method).security).toEqual([
        { [documentation.OPENAPI_BEARER_SCHEME]: [] },
      ])
    }
  })

  function operation(path: string, method: HttpMethod): OperationObject {
    const result = document.paths[path]?.[method]

    if (result === undefined) {
      throw new Error(`Missing ${method.toUpperCase()} ${path} from OpenAPI document`)
    }

    return result
  }
})
