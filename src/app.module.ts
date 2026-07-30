import { Module } from '@nestjs/common'

import { ConfigurationModule } from './shared/infrastructure/config/configuration.module'

@Module({
  imports: [ConfigurationModule],
})
export class AppModule {}
