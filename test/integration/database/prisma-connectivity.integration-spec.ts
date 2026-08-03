import type { TestingModule } from '@nestjs/testing'
import { Test } from '@nestjs/testing'

import { ConfigurationModule } from '../../../src/shared/infrastructure/config/configuration.module'
import { DatabaseModule } from '../../../src/shared/infrastructure/database/database.module'
import { PrismaService } from '../../../src/shared/infrastructure/database/prisma.service'

interface DatabaseIdentity {
  readonly databaseName: string
  readonly schemaName: string
}

interface MigrationStatus {
  readonly migrationName: string
  readonly finishedAt: Date | null
  readonly rolledBackAt: Date | null
}

describe('Prisma PostgreSQL infrastructure', () => {
  let module: TestingModule
  let prisma: PrismaService

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ConfigurationModule, DatabaseModule],
    }).compile()
    await module.init()
    prisma = module.get(PrismaService)
  })

  afterAll(async () => {
    await module.close()
  })

  it('connects to the dedicated PostgreSQL test database', async () => {
    const [identity] = await prisma.$queryRaw<DatabaseIdentity[]>`
      SELECT
        current_database() AS "databaseName",
        current_schema() AS "schemaName"
    `

    expect(identity?.databaseName).toMatch(/_(?:test|testing)$/)
    expect(identity?.schemaName).toBe('public')
  })

  it('applies every migration successfully to the reset database', async () => {
    const migrations = await prisma.$queryRaw<MigrationStatus[]>`
      SELECT
        migration_name AS "migrationName",
        finished_at AS "finishedAt",
        rolled_back_at AS "rolledBackAt"
      FROM _prisma_migrations
      ORDER BY migration_name
    `

    expect(migrations).toHaveLength(1)
    expect(migrations[0]?.migrationName).toBe('20260731000000_postgresql_foundation')
    expect(migrations[0]?.finishedAt).toBeInstanceOf(Date)
    expect(migrations[0]?.rolledBackAt).toBeNull()
  })
})
