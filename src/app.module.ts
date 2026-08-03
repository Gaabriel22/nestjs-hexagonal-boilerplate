import { Module } from '@nestjs/common'

import { IdentityModule } from './identity/identity.module'
import { ConfigurationModule } from './shared/infrastructure/config/configuration.module'
import { DatabaseModule } from './shared/infrastructure/database/database.module'

@Module({
  imports: [ConfigurationModule, DatabaseModule, IdentityModule],
})
export class AppModule {}
