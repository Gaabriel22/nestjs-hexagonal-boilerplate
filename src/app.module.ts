import { Module } from '@nestjs/common'

import { ConfigurationModule } from './shared/infrastructure/config/configuration.module'
import { DatabaseModule } from './shared/infrastructure/database/database.module'

@Module({
  imports: [ConfigurationModule, DatabaseModule],
})
export class AppModule {}
