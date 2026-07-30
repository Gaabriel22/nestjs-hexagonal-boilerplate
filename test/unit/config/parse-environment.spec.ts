import type { ApplicationConfig } from '../../../src/shared/infrastructure/config/environment.schema'
import { EnvironmentValidationError } from '../../../src/shared/infrastructure/config/environment-validation.error'
import { parseEnvironment } from '../../../src/shared/infrastructure/config/parse-environment'

const VALID_ENVIRONMENT = Object.freeze({
  DATABASE_URL: 'postgresql://app:password@localhost:5432/app_test',
  AUTH_ACCESS_TOKEN_SECRET: 'access-token-secret-at-least-32-characters',
  AUTH_REFRESH_TOKEN_HASH_SECRET: 'refresh-token-secret-at-least-32-characters',
})

function parseValidEnvironment(overrides: Record<string, unknown> = {}): ApplicationConfig {
  return parseEnvironment({ ...VALID_ENVIRONMENT, ...overrides })
}

describe('parseEnvironment', () => {
  it('parses every configuration group into immutable typed values', () => {
    const config = parseValidEnvironment({
      NODE_ENV: 'production',
      HOST: '127.0.0.1',
      PORT: '8080',
      AUTH_ACCESS_TOKEN_TTL_SECONDS: '600',
      AUTH_REFRESH_TOKEN_TTL_SECONDS: '1200',
      CORS_ORIGINS: 'https://app.example.com,https://admin.example.com',
      HTTP_BODY_LIMIT_BYTES: '2048',
      RATE_LIMIT_MAX: '50',
      RATE_LIMIT_WINDOW_SECONDS: '30',
      LOG_LEVEL: 'warn',
      DOCS_ENABLED: 'false',
      DOCS_OPENAPI_PATH: '/docs/openapi.json',
      DOCS_REFERENCE_PATH: '/docs/reference',
    })

    expect(config).toEqual({
      application: {
        environment: 'production',
        host: '127.0.0.1',
        port: 8080,
      },
      database: {
        url: VALID_ENVIRONMENT.DATABASE_URL,
      },
      authentication: {
        accessTokenSecret: VALID_ENVIRONMENT.AUTH_ACCESS_TOKEN_SECRET,
        accessTokenTtlSeconds: 600,
        refreshTokenHashSecret: VALID_ENVIRONMENT.AUTH_REFRESH_TOKEN_HASH_SECRET,
        refreshTokenTtlSeconds: 1200,
      },
      cors: {
        origins: ['https://app.example.com', 'https://admin.example.com'],
      },
      http: {
        bodyLimitBytes: 2048,
      },
      rateLimit: {
        max: 50,
        windowSeconds: 30,
      },
      logging: {
        level: 'warn',
      },
      documentation: {
        enabled: false,
        openApiPath: '/docs/openapi.json',
        referencePath: '/docs/reference',
      },
    })
    expect(Object.isFrozen(config)).toBe(true)
    expect(Object.isFrozen(config.authentication)).toBe(true)
    expect(Object.isFrozen(config.cors.origins)).toBe(true)
  })

  it('applies centralized defaults', () => {
    const config = parseValidEnvironment()

    expect(config.application).toEqual({
      environment: 'development',
      host: '0.0.0.0',
      port: 3000,
    })
    expect(config.authentication.accessTokenTtlSeconds).toBe(900)
    expect(config.authentication.refreshTokenTtlSeconds).toBe(2_592_000)
    expect(config.cors.origins).toEqual(['http://localhost:3000'])
    expect(config.http.bodyLimitBytes).toBe(1_048_576)
    expect(config.rateLimit).toEqual({ max: 100, windowSeconds: 60 })
    expect(config.logging.level).toBe('info')
    expect(config.documentation).toEqual({
      enabled: true,
      openApiPath: '/openapi.json',
      referencePath: '/reference',
    })
  })

  it('reports all missing required values', () => {
    expect.assertions(2)

    try {
      parseEnvironment({})
    } catch (error) {
      expect(error).toBeInstanceOf(EnvironmentValidationError)
      expect((error as EnvironmentValidationError).issues.map((issue) => issue.path)).toEqual([
        'DATABASE_URL',
        'AUTH_ACCESS_TOKEN_SECRET',
        'AUTH_REFRESH_TOKEN_HASH_SECRET',
      ])
    }
  })

  it('reports malformed values without accepting unsafe coercions', () => {
    expect.assertions(1)

    try {
      parseValidEnvironment({
        PORT: '0',
        DATABASE_URL: 'https://database.example.com',
        CORS_ORIGINS: 'not-a-url',
        RATE_LIMIT_MAX: '-1',
        LOG_LEVEL: 'verbose',
        DOCS_ENABLED: 'yes',
      })
    } catch (error) {
      expect((error as EnvironmentValidationError).issues.map((issue) => issue.path)).toEqual([
        'PORT',
        'DATABASE_URL',
        'CORS_ORIGINS.0',
        'RATE_LIMIT_MAX',
        'LOG_LEVEL',
        'DOCS_ENABLED',
      ])
    }
  })

  it('redacts secret values from startup diagnostics', () => {
    const exposedSecret = 'short-secret'

    expect(() =>
      parseValidEnvironment({
        DATABASE_URL: 'database-password',
        AUTH_ACCESS_TOKEN_SECRET: exposedSecret,
        AUTH_REFRESH_TOKEN_HASH_SECRET: exposedSecret,
      }),
    ).toThrow('AUTH_ACCESS_TOKEN_SECRET: is required or invalid')

    try {
      parseValidEnvironment({
        DATABASE_URL: 'database-password',
        AUTH_ACCESS_TOKEN_SECRET: exposedSecret,
        AUTH_REFRESH_TOKEN_HASH_SECRET: exposedSecret,
      })
    } catch (error) {
      expect((error as Error).message).not.toContain(exposedSecret)
      expect((error as Error).message).not.toContain('database-password')
    }
  })
})
