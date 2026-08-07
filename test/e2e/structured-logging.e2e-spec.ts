import { PrismaService } from '../../src/shared/infrastructure/database/prisma.service'
import type { ProblemDetails } from '../../src/shared/infrastructure/http/problem-details'
import type { ApplicationHarness } from '../support/application-harness'
import { createApplicationHarness } from '../support/application-harness'
import { HttpPlatformFixtureModule } from './fixtures/http-platform.fixture'

const VALID_PASSWORD = 'Correlated registration password 1!'
const CLIENT_REQUEST_IDENTIFIER = 'client.registration:123'

function logRecords(harness: ApplicationHarness): readonly Record<string, unknown>[] {
  return harness.logLines.flatMap((entry) =>
    entry
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line) as Record<string, unknown>),
  )
}

describe('structured logging and request correlation', () => {
  it('returns a generated identifier and records one bounded completion event', async () => {
    const harness = await createApplicationHarness(HttpPlatformFixtureModule)

    try {
      const response = await harness.application.inject({
        method: 'GET',
        url: '/api/v1/platform-probe/application-error?userId=unbounded-value',
        headers: { 'x-request-id': 'invalid identifier' },
      })
      const problem = response.json<ProblemDetails>()
      const requestIdentifier = response.headers['x-request-id']
      const completionLogs = logRecords(harness).filter(
        (record) => record.event === 'http.request.completed',
      )

      expect(requestIdentifier).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      )
      expect(problem.requestId).toBe(requestIdentifier)
      expect(completionLogs).toHaveLength(1)
      expect(completionLogs[0]).toMatchObject({
        severity: 'info',
        event: 'http.request.completed',
        requestId: requestIdentifier,
        method: 'GET',
        route: '/api/v1/platform-probe/application-error',
        status: 409,
      })
      expect(typeof completionLogs[0]?.durationMs).toBe('number')
      expect(JSON.stringify(completionLogs[0])).not.toContain('unbounded-value')
    } finally {
      await harness.close()
    }
  })

  it('propagates a valid client identifier to the response, request log, and audit event', async () => {
    const harness = await createApplicationHarness()
    const prisma = harness.application.get(PrismaService)

    try {
      await prisma.user.deleteMany()

      const response = await harness.application.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        headers: {
          authorization: 'Bearer must-not-appear',
          cookie: 'session=must-not-appear',
          'x-request-id': CLIENT_REQUEST_IDENTIFIER,
        },
        payload: {
          email: 'correlated@example.com',
          password: VALID_PASSWORD,
        },
      })
      const auditEvent = await prisma.auditEvent.findFirstOrThrow({
        where: { action: 'identity.user_registered' },
      })
      const completionLogs = logRecords(harness).filter(
        (record) => record.event === 'http.request.completed',
      )

      expect(response.statusCode).toBe(201)
      expect(response.headers['x-request-id']).toBe(CLIENT_REQUEST_IDENTIFIER)
      expect(auditEvent.requestIdentifier).toBe(CLIENT_REQUEST_IDENTIFIER)
      expect(completionLogs).toHaveLength(1)
      expect(completionLogs[0]).toMatchObject({
        requestId: CLIENT_REQUEST_IDENTIFIER,
        route: '/api/v1/auth/register',
        status: 201,
      })
      expect(JSON.stringify(logRecords(harness))).not.toContain('must-not-appear')
      expect(JSON.stringify(logRecords(harness))).not.toContain(VALID_PASSWORD)
    } finally {
      await harness.close()
    }
  })

  it('serializes unexpected request errors without leaking their details to the response', async () => {
    const harness = await createApplicationHarness(HttpPlatformFixtureModule)

    try {
      const response = await harness.application.inject({
        method: 'GET',
        url: '/api/v1/platform-probe/unexpected-error',
      })
      const errorLog = logRecords(harness).find(
        (record) => record.event === 'application.log' && record.context === 'ProblemDetailsFilter',
      )

      expect(response.statusCode).toBe(500)
      expect(response.body).not.toContain('internal implementation detail')
      expect(errorLog).toMatchObject({
        severity: 'error',
        error: {
          type: 'Error',
          message: 'Unhandled request exception',
        },
      })
      expect((errorLog?.error as Record<string, unknown>).stack).toEqual(
        expect.stringContaining('internal implementation detail'),
      )
    } finally {
      await harness.close()
    }
  })
})
