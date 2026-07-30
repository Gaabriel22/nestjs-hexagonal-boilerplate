import type { NestFastifyApplication } from '@nestjs/platform-fastify'

import { createApplication } from '../src/bootstrap'

describe('application bootstrap', () => {
  let application: NestFastifyApplication | undefined

  afterEach(async () => {
    await application?.close()
  })

  it('starts and closes the NestJS Fastify application', async () => {
    application = await createApplication()

    await application.init()

    expect(application.getHttpAdapter().getType()).toBe('fastify')
  })
})
