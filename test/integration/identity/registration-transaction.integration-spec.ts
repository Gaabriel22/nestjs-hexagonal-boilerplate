import type { TestingModule } from '@nestjs/testing'
import { Test } from '@nestjs/testing'

import { Credential } from '../../../src/identity/domain/entities/credential'
import { IdentityUser } from '../../../src/identity/domain/entities/identity-user'
import { PrismaRegistrationRepository } from '../../../src/identity/infrastructure/persistence/prisma/repositories/prisma-registration.repository'
import { ConfigurationModule } from '../../../src/shared/infrastructure/config/configuration.module'
import { DatabaseModule } from '../../../src/shared/infrastructure/database/database.module'
import { PrismaService } from '../../../src/shared/infrastructure/database/prisma.service'

const USER_ID = '00000000-0000-4000-8000-000000000201'
const OTHER_USER_ID = '00000000-0000-4000-8000-000000000202'
const CURRENT_TIME = new Date('2026-01-01T10:00:00.000Z')

function createUser(id: string): IdentityUser {
  return IdentityUser.create({ id, email: 'person@example.com', currentTime: CURRENT_TIME })
}

function createCredential(userId: string): Credential {
  return Credential.create({ userId, passwordHash: 'argon2id-hash', currentTime: CURRENT_TIME })
}

describe('registration transaction', () => {
  let module: TestingModule
  let prisma: PrismaService
  let repository: PrismaRegistrationRepository

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ConfigurationModule, DatabaseModule],
      providers: [PrismaRegistrationRepository],
    }).compile()
    await module.init()

    prisma = module.get(PrismaService)
    repository = module.get(PrismaRegistrationRepository)
  })

  beforeEach(async () => {
    await prisma.user.deleteMany()
  })

  afterAll(async () => {
    await module.close()
  })

  it('commits user and credential together', async () => {
    await expect(
      repository.createUserWithCredential(createUser(USER_ID), createCredential(USER_ID)),
    ).resolves.toBe('created')

    await expect(prisma.user.count()).resolves.toBe(1)
    await expect(prisma.credential.count()).resolves.toBe(1)
  })

  it('returns an email conflict without creating partial records', async () => {
    await repository.createUserWithCredential(createUser(USER_ID), createCredential(USER_ID))

    await expect(
      repository.createUserWithCredential(
        createUser(OTHER_USER_ID),
        createCredential(OTHER_USER_ID),
      ),
    ).resolves.toBe('email_conflict')
    await expect(prisma.user.count()).resolves.toBe(1)
    await expect(prisma.credential.count()).resolves.toBe(1)
  })

  it('rolls the user back when credential persistence fails', async () => {
    const invalidCredential = Credential.restore({
      userId: USER_ID,
      passwordHash: '',
      createdAt: CURRENT_TIME,
      updatedAt: CURRENT_TIME,
    })

    await expect(
      repository.createUserWithCredential(createUser(USER_ID), invalidCredential),
    ).rejects.toThrow()
    await expect(prisma.user.count()).resolves.toBe(0)
    await expect(prisma.credential.count()).resolves.toBe(0)
  })
})
