import type { ApplicationHarness } from '../support/application-harness'
import { createApplicationHarness } from '../support/application-harness'

describe('application bootstrap', () => {
  let harness: ApplicationHarness | undefined

  afterEach(async () => {
    await harness?.close()
  })

  it('starts and closes the NestJS Fastify application', async () => {
    harness = await createApplicationHarness()

    expect(harness.application.getHttpAdapter().getType()).toBe('fastify')
  })
})
