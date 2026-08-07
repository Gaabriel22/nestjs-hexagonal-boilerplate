import type { Type } from '@nestjs/common'
import type { NestFastifyApplication } from '@nestjs/platform-fastify'

import { createApplication } from '../../src/bootstrap'
import type { ApplicationConfig } from '../../src/shared/infrastructure/config/environment.schema'

export interface ApplicationHarness {
  readonly application: NestFastifyApplication
  readonly logLines: readonly string[]
  close(): Promise<void>
}

export async function createApplicationHarness(
  rootModule?: Type,
  config?: ApplicationConfig,
): Promise<ApplicationHarness> {
  const logLines: string[] = []
  const application = await createApplication(rootModule, config, {
    loggerDestination: {
      write: (message: string): void => {
        logLines.push(message)
      },
    },
  })
  await application.init()

  return {
    application,
    logLines,
    close: async (): Promise<void> => {
      await application.close()
    },
  }
}
