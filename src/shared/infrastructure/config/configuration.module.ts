import { Global, Module } from '@nestjs/common'
import { ConfigModule as NestConfigModule } from '@nestjs/config'

import { parseEnvironment } from './parse-environment'

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      cache: true,
      expandVariables: false,
      isGlobal: true,
      validate: parseEnvironment,
    }),
  ],
  exports: [NestConfigModule],
})
export class ConfigurationModule {}
