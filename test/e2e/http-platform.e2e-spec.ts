import type { ProblemDetails } from '../../src/shared/infrastructure/http/problem-details'
import type { ApplicationHarness } from '../support/application-harness'
import { createApplicationHarness } from '../support/application-harness'
import { HttpPlatformFixtureModule } from './fixtures/http-platform.fixture'

describe('HTTP platform', () => {
  let harness: ApplicationHarness

  beforeEach(async () => {
    harness = await createApplicationHarness(HttpPlatformFixtureModule)
  })

  afterEach(async () => {
    await harness.close()
  })

  it('routes supported URI versions and applies declared DTO transformations', async () => {
    const response = await harness.application.inject({
      method: 'POST',
      url: '/api/v1/platform-probe/validate',
      payload: {
        name: 'probe',
        count: '2',
      },
    })

    expect(response.statusCode).toBe(201)
    expect(response.json()).toEqual({
      name: 'probe',
      count: 2,
    })
  })

  it('rejects unsupported versions with Problem Details', async () => {
    const response = await harness.application.inject({
      method: 'POST',
      url: '/api/v2/platform-probe/validate',
      payload: {
        name: 'probe',
        count: 2,
      },
    })

    expect(response.statusCode).toBe(404)
    expect(response.json()).toMatchObject({
      type: 'urn:problem:http.404',
      title: 'Not Found',
      status: 404,
      instance: '/api/v2/platform-probe/validate',
      code: 'http.404',
    })
  })

  it('returns field-level validation details and rejects unknown properties', async () => {
    const response = await harness.application.inject({
      method: 'POST',
      url: '/api/v1/platform-probe/validate',
      payload: {
        name: '',
        count: 0,
        unexpected: true,
      },
    })

    const problem = response.json<ProblemDetails>()

    expect(response.statusCode).toBe(400)
    expect(problem).toMatchObject({
      type: 'urn:problem:request.validation_failed',
      status: 400,
      code: 'request.validation_failed',
      detail: 'Request validation failed',
    })
    expect(problem.errors?.map((error) => error.field)).toEqual(
      expect.arrayContaining(['name', 'count', 'unexpected']),
    )
  })

  it('maps application errors without transport concerns in the application layer', async () => {
    const response = await harness.application.inject({
      method: 'GET',
      url: '/api/v1/platform-probe/application-error',
    })

    expect(response.statusCode).toBe(409)
    expect(response.json()).toMatchObject({
      type: 'urn:problem:probe.already_exists',
      title: 'Conflict',
      status: 409,
      detail: 'Probe already exists',
      code: 'probe.already_exists',
    })
  })

  it('maps domain rule failures to unprocessable Problem Details', async () => {
    const response = await harness.application.inject({
      method: 'GET',
      url: '/api/v1/platform-probe/domain-error',
    })

    expect(response.statusCode).toBe(422)
    expect(response.json()).toMatchObject({
      type: 'urn:problem:probe.rule_violated',
      title: 'Unprocessable Entity',
      status: 422,
      detail: 'Probe rule was violated',
      code: 'probe.rule_violated',
    })
  })

  it('hides unexpected error details', async () => {
    const response = await harness.application.inject({
      method: 'GET',
      url: '/api/v1/platform-probe/unexpected-error',
    })
    const problem = response.json<ProblemDetails>()

    expect(response.statusCode).toBe(500)
    expect(problem).toMatchObject({
      type: 'urn:problem:internal.unexpected_error',
      title: 'Internal Server Error',
      status: 500,
      detail: 'An unexpected error occurred',
      code: 'internal.unexpected_error',
    })
    expect(JSON.stringify(problem)).not.toContain('internal implementation detail')
    expect(problem).not.toHaveProperty('stack')
  })

  it('rejects request bodies above the configured limit', async () => {
    const response = await harness.application.inject({
      method: 'POST',
      url: '/api/v1/platform-probe/validate',
      payload: {
        name: 'x'.repeat(2_000),
        count: 1,
      },
    })

    expect(response.statusCode).toBe(413)
    expect(response.json()).toMatchObject({
      status: 413,
      code: 'request.payload_too_large',
    })
  })

  it('returns Problem Details after exceeding the configured rate', async () => {
    const request = {
      method: 'GET' as const,
      url: '/api/v1/platform-probe/domain-error',
    }

    await harness.application.inject(request)
    await harness.application.inject(request)
    const response = await harness.application.inject(request)
    const problem = response.json<ProblemDetails>()

    expect(response.statusCode).toBe(429)
    expect(problem).toMatchObject({
      type: 'urn:problem:request.rate_limit_exceeded',
      title: 'Too Many Requests',
      status: 429,
      code: 'request.rate_limit_exceeded',
    })
  })

  it('adds security headers', async () => {
    const response = await harness.application.inject({
      method: 'GET',
      url: '/api/v1/platform-probe/domain-error',
    })

    expect(response.headers['x-content-type-options']).toBe('nosniff')
    expect(response.headers['x-frame-options']).toBe('SAMEORIGIN')
  })

  it('allows configured CORS origins', async () => {
    const response = await harness.application.inject({
      method: 'OPTIONS',
      url: '/api/v1/platform-probe/validate',
      headers: {
        origin: 'http://localhost:3000',
        'access-control-request-method': 'POST',
      },
    })

    expect(response.statusCode).toBe(204)
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000')
  })
})
