import type { DestinationStream } from 'pino'

import { parseEnvironment } from '../../../src/shared/infrastructure/config/parse-environment'
import { AsyncLocalRequestContext } from '../../../src/shared/infrastructure/observability/async-local-request-context'
import {
  isValidRequestIdentifier,
  resolveRequestIdentifier,
} from '../../../src/shared/infrastructure/observability/request-identifier'
import {
  createStructuredLogger,
  REDACTION_MARKER,
} from '../../../src/shared/infrastructure/observability/structured-logger'

const TEST_CONFIG = parseEnvironment({
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://app:app@localhost:5432/app_test',
  AUTH_ACCESS_TOKEN_SECRET: 'test-access-token-secret-at-least-32-characters',
  AUTH_REFRESH_TOKEN_HASH_SECRET: 'test-refresh-token-secret-at-least-32-characters',
})

function captureDestination(lines: string[]): DestinationStream {
  return {
    write: (message: string): void => {
      lines.push(message)
    },
  }
}

function parseLastLog(lines: readonly string[]): Record<string, unknown> {
  const line = lines.at(-1)

  if (line === undefined) {
    throw new Error('Expected one structured log line')
  }

  return JSON.parse(line) as Record<string, unknown>
}

describe('structured observability', () => {
  it('emits baseline JSON fields and redacts configured sensitive values', () => {
    const lines: string[] = []
    const { logger } = createStructuredLogger(TEST_CONFIG, captureDestination(lines))

    logger.info(
      {
        event: 'security.redaction_probe',
        authorization: 'Bearer top-secret',
        request: {
          cookie: 'session=top-secret',
          credentials: 'top-secret-credentials',
          body: {
            password: 'top-secret-password',
            refreshToken: 'top-secret-refresh-token',
          },
        },
      },
      'Redaction probe',
    )

    const record = parseLastLog(lines)
    const serialized = JSON.stringify(record)

    expect(record).toMatchObject({
      severity: 'info',
      service: 'nestjs-hexagonal-boilerplate',
      environment: 'test',
      event: 'security.redaction_probe',
      authorization: REDACTION_MARKER,
      request: {
        cookie: REDACTION_MARKER,
        credentials: REDACTION_MARKER,
      },
    })
    expect(record.timestamp).toEqual(expect.any(String))
    expect(serialized).not.toContain('top-secret')
  })

  it('serializes errors with type, message, and stack', () => {
    const lines: string[] = []
    const { nestLogger } = createStructuredLogger(TEST_CONFIG, captureDestination(lines))

    nestLogger.error(new Error('serialized failure'))

    const record = parseLastLog(lines)

    expect(record).toMatchObject({
      severity: 'error',
      event: 'application.log',
      error: {
        type: 'Error',
        message: 'serialized failure',
      },
    })
    expect((record.error as Record<string, unknown>).stack).toEqual(
      expect.stringContaining('serialized failure'),
    )
  })

  it('accepts bounded safe identifiers and replaces invalid values', () => {
    const validIdentifier = 'client.request:123-ABC'

    expect(isValidRequestIdentifier(validIdentifier)).toBe(true)
    expect(resolveRequestIdentifier(validIdentifier)).toBe(validIdentifier)
    expect(isValidRequestIdentifier('contains spaces')).toBe(false)
    expect(isValidRequestIdentifier('x'.repeat(129))).toBe(false)
    expect(resolveRequestIdentifier('contains spaces')).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    )
  })

  it('keeps request identifiers isolated across async execution chains', async () => {
    const context = new AsyncLocalRequestContext()

    const readIdentifier = async (identifier: string): Promise<string | null> =>
      new Promise((resolve) => {
        context.run(identifier, () => {
          setImmediate(() => resolve(context.getRequestIdentifier()))
        })
      })

    await expect(
      Promise.all([readIdentifier('request-one'), readIdentifier('request-two')]),
    ).resolves.toEqual(['request-one', 'request-two'])
    expect(context.getRequestIdentifier()).toBeNull()
  })
})
