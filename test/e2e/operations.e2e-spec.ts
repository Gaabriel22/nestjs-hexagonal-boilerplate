import { PrismaReadinessProbe } from '../../src/operations/infrastructure/database/prisma-readiness.probe'
import type { ApplicationHarness } from '../support/application-harness'
import { createApplicationHarness } from '../support/application-harness'

describe('operational endpoints', () => {
  let harness: ApplicationHarness

  beforeAll(async () => {
    harness = await createApplicationHarness()
  })

  afterAll(async () => {
    await harness.close()
  })

  it('reports liveness without dependency details', async () => {
    const response = await harness.application.inject({
      method: 'GET',
      url: '/api/health/live',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ status: 'live' })
  })

  it('reports readiness when PostgreSQL responds', async () => {
    const response = await harness.application.inject({
      method: 'GET',
      url: '/api/health/ready',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      status: 'ready',
      checks: { postgresql: 'up' },
    })
  })

  it('returns a safe HTTP 503 response when PostgreSQL is unavailable', async () => {
    const probe = harness.application.get(PrismaReadinessProbe)
    jest.spyOn(probe, 'check').mockRejectedValueOnce(new Error('database secret'))

    const response = await harness.application.inject({
      method: 'GET',
      url: '/api/health/ready',
    })

    expect(response.statusCode).toBe(503)
    expect(response.json()).toEqual({
      status: 'not_ready',
      checks: { postgresql: 'down' },
    })
    expect(response.body).not.toContain('secret')
  })

  it('exports Prometheus metrics using route templates instead of resource identifiers', async () => {
    const firstOrganizationId = '0198f584-5967-7435-9538-36f1137dbc55'
    const secondOrganizationId = '0198f584-5967-7435-9538-36f1137dbc56'

    for (const organizationId of [firstOrganizationId, secondOrganizationId]) {
      await harness.application.inject({
        method: 'GET',
        url: `/api/v1/organizations/${organizationId}/audit-events`,
      })
    }

    const response = await harness.application.inject({
      method: 'GET',
      url: '/api/metrics',
    })

    expect(response.statusCode).toBe(200)
    expect(response.headers['content-type']).toContain('text/plain')
    expect(response.body).toContain('boilerplate_process_cpu_user_seconds_total')
    expect(response.body).toContain('boilerplate_http_requests_total')
    expect(response.body).toContain('boilerplate_http_request_duration_seconds')
    expect(response.body).toContain('route="/api/v1/organizations/:organizationId/audit-events"')
    expect(response.body).not.toContain(firstOrganizationId)
    expect(response.body).not.toContain(secondOrganizationId)
    expect(response.body).not.toMatch(/user_id=|tenant_id=|token=|request_id=/)
  })
})
