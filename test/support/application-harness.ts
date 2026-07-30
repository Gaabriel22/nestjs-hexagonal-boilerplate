import type { Type } from '@nestjs/common'
import type { NestFastifyApplication } from '@nestjs/platform-fastify'

import { createApplication } from '../../src/bootstrap'

export interface ApplicationHarness {
  readonly application: NestFastifyApplication
  close(): Promise<void>
}

export async function createApplicationHarness(rootModule?: Type): Promise<ApplicationHarness> {
  const application = await createApplication(rootModule)
  application.useLogger(false)
  await application.init()

  return {
    application,
    close: async (): Promise<void> => {
      await application.close()
    },
  }
}
