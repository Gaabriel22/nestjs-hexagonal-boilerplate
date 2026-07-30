import type { NestFastifyApplication } from '@nestjs/platform-fastify'

import { createApplication } from '../../src/bootstrap'

export interface ApplicationHarness {
  readonly application: NestFastifyApplication
  close(): Promise<void>
}

export async function createApplicationHarness(): Promise<ApplicationHarness> {
  const application = await createApplication()
  application.useLogger(false)
  await application.init()

  return {
    application,
    close: async (): Promise<void> => {
      await application.close()
    },
  }
}
