import type { ApplicationHarness } from '../support/application-harness'
import { createApplicationHarness } from '../support/application-harness'
import { applicationConfig } from '../../src/shared/infrastructure/config/application-config'

const documentationConfig = {
  ...applicationConfig,
  documentation: {
    ...applicationConfig.documentation,
    enabled: true,
  },
}

describe('API documentation', () => {
  let harness: ApplicationHarness

  beforeEach(async () => {
    harness = await createApplicationHarness(undefined, documentationConfig)
  })

  afterEach(async () => {
    await harness.close()
  })

  it('serves the raw OpenAPI document from its non-versioned route', async () => {
    const response = await harness.application.inject({ method: 'GET', url: '/openapi.json' })
    const document = response.json<Record<string, unknown>>()

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('application/json')
    expect(document).toMatchObject({
      info: { title: 'NestJS Hexagonal Boilerplate API', version: '1.0.0' },
    })
    expect(typeof document.openapi).toBe('string')
    expect(document.openapi).toEqual(expect.stringMatching(/^3\./))
    expect(document.paths).toHaveProperty('/api/v1/auth/register')
  })

  it('serves Scalar API Reference against the configured raw document route', async () => {
    const redirect = await harness.application.inject({ method: 'GET', url: '/reference' })
    const response = await harness.application.inject({
      method: 'GET',
      url: redirect.headers.location ?? '/reference/',
    })

    expect(redirect.statusCode).toBe(301)
    expect(redirect.headers.location).toBe('/reference/')
    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('text/html')
    expect(response.body).toContain('NestJS Hexagonal Boilerplate API Reference')
    expect(response.body).toContain('/openapi.json')
    expect(response.body.toLowerCase()).toContain('scalar')
    expect(response.headers['content-security-policy']).toMatch(
      /script-src 'self' 'nonce-[A-Za-z0-9+/=]+'/,
    )
    expect(response.body).toMatch(/nonce="[A-Za-z0-9+/=]+"/)
  })
})
