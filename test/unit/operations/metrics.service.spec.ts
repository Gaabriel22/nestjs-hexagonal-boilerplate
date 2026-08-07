import { MetricsService } from '../../../src/operations/infrastructure/metrics/metrics.service'

describe('MetricsService', () => {
  let metrics: MetricsService

  beforeEach(() => {
    metrics = new MetricsService()
  })

  afterEach(() => {
    metrics.onModuleDestroy()
  })

  it('exports process, request count and request duration metrics', async () => {
    metrics.recordHttpRequest({
      method: 'GET',
      route: '/api/v1/organizations/:organizationId/audit-events',
      statusCode: 200,
      durationMilliseconds: 25,
    })

    await expect(metrics.render()).resolves.toEqual(
      expect.stringContaining('boilerplate_process_cpu_user_seconds_total'),
    )
    await expect(metrics.render()).resolves.toEqual(
      expect.stringContaining('boilerplate_http_requests_total'),
    )
    await expect(metrics.render()).resolves.toEqual(
      expect.stringContaining('boilerplate_http_request_duration_seconds'),
    )
  })

  it('uses only bounded route-template labels', async () => {
    const route = '/api/v1/organizations/:organizationId/audit-events'

    for (const requestId of ['0198f584-5967-7435-9538-36f1137dbc55', 'tenant-secret-42']) {
      metrics.recordHttpRequest({
        method: 'GET',
        route,
        statusCode: 401,
        durationMilliseconds: 10,
      })

      expect(await metrics.render()).not.toContain(requestId)
    }

    const output = await metrics.render()

    expect(output).toContain(
      'boilerplate_http_requests_total{method="GET",route="/api/v1/organizations/:organizationId/audit-events",status_code="401"} 2',
    )
    expect(output).not.toMatch(/user_id=|tenant_id=|token=|request_id=/)
  })
})
