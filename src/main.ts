import { ConfigService } from '@nestjs/config'

import { createApplication } from './bootstrap'
import type { ApplicationConfig } from './shared/infrastructure/config/environment.schema'

async function bootstrap(): Promise<void> {
  const application = await createApplication()
  const config = application.get<ConfigService<ApplicationConfig, true>>(ConfigService)
  const host = config.get('application.host', { infer: true })
  const port = config.get('application.port', { infer: true })

  await application.listen(port, host)
}

void bootstrap()
