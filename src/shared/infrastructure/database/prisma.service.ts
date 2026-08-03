import { PrismaPg } from '@prisma/adapter-pg'
import { Injectable, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

import { PrismaClient } from '../../../generated/prisma/client'
import type { ApplicationConfig } from '../config/environment.schema'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(config: ConfigService<ApplicationConfig, true>) {
    const { url: connectionString } = config.getOrThrow<ApplicationConfig['database']>('database')
    const adapter = new PrismaPg({
      connectionString,
      connectionTimeoutMillis: 5_000,
      idleTimeoutMillis: 10_000,
      max: 10,
    })

    super({ adapter })
  }

  async onModuleInit(): Promise<void> {
    await this.$connect()
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect()
  }
}
