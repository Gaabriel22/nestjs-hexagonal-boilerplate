import { Global, Module } from '@nestjs/common'
import { ConfigModule as NestConfigModule } from '@nestjs/config'

import { applicationConfig } from './application-config'
import type { ApplicationConfig } from './environment.schema'

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      cache: true,
      ignoreEnvFile: true,
      isGlobal: true,
      load: [(): ApplicationConfig => applicationConfig],
    }),
  ],
  exports: [NestConfigModule],
})
export class ConfigurationModule {}
