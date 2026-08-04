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

    expect(migrations).toHaveLength(5)
    expect(migrations.map(({ migrationName }) => migrationName)).toEqual([
      '20260731000000_postgresql_foundation',
      '20260803221953_identity_persistence',
      '20260804000000_session_refresh_rotation',
      '20260804010000_user_profile',
      '20260804020000_organization_creation',
    ])
    expect(migrations.every(({ finishedAt }) => finishedAt instanceof Date)).toBe(true)
    expect(migrations.every(({ rolledBackAt }) => rolledBackAt === null)).toBe(true)
  })
})
