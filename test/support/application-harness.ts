import type { Type } from '@nestjs/common'
import type { NestFastifyApplication } from '@nestjs/platform-fastify'

import { createApplication } from '../../src/bootstrap'
import type { ApplicationConfig } from '../../src/shared/infrastructure/config/environment.schema'

export interface ApplicationHarness {
  readonly application: NestFastifyApplication
  close(): Promise<void>
}

export async function createApplicationHarness(
  rootModule?: Type,
  config?: ApplicationConfig,
): Promise<ApplicationHarness> {
  const application = await createApplication(rootModule, config)
  application.useLogger(false)
  await application.init()

  return {
    application,
    close: async (): Promise<void> => {
      await application.close()
    },
  }
}
