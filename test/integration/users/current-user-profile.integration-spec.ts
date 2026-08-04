import type { TestingModule } from '@nestjs/testing'
import { Test } from '@nestjs/testing'

import { CurrentUserProfileNotFoundError } from '../../../src/users/application/errors/current-user-profile-not-found.error'
import { InvalidDisplayNameError } from '../../../src/users/application/errors/invalid-display-name.error'
import { GetCurrentUserProfile } from '../../../src/users/application/use-cases/get-current-user-profile'
import { UpdateCurrentUserProfile } from '../../../src/users/application/use-cases/update-current-user-profile'
import { ConfigurationModule } from '../../../src/shared/infrastructure/config/configuration.module'
import { DatabaseModule } from '../../../src/shared/infrastructure/database/database.module'
import { PrismaService } from '../../../src/shared/infrastructure/database/prisma.service'
import { UsersModule } from '../../../src/users/users.module'

const USER_ID = '00000000-0000-4000-8000-000000000801'
const CREATED_AT = new Date('2026-01-01T10:00:00.000Z')

describe('current user profile persistence', () => {
  let module: TestingModule
  let prisma: PrismaService
  let getProfile: GetCurrentUserProfile
  let updateProfile: UpdateCurrentUserProfile

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ConfigurationModule, DatabaseModule, UsersModule],
    }).compile()
    await module.init()

    prisma = module.get(PrismaService)
    getProfile = module.get(GetCurrentUserProfile)
    updateProfile = module.get(UpdateCurrentUserProfile)
  })

  beforeEach(async () => {
    await prisma.user.deleteMany()
    await prisma.user.create({
      data: {
        id: USER_ID,
        normalizedEmail: 'profile@example.com',
        displayName: 'Initial Person',
        isActive: true,
        createdAt: CREATED_AT,
        updatedAt: CREATED_AT,
      },
    })
  })

  afterAll(async () => {
    await module.close()
  })

  it('maps the persisted user to the safe profile projection', async () => {
    await expect(getProfile.execute(USER_ID)).resolves.toEqual({
      id: USER_ID,
      email: 'profile@example.com',
      displayName: 'Initial Person',
      isActive: true,
      createdAt: CREATED_AT,
      updatedAt: CREATED_AT,
    })
  })

  it('persists a normalized supported profile update', async () => {
    const result = await updateProfile.execute(USER_ID, '  Updated   Person  ')

    expect(result).toMatchObject({
      id: USER_ID,
      email: 'profile@example.com',
      displayName: 'Updated Person',
      isActive: true,
    })
    await expect(prisma.user.findUniqueOrThrow({ where: { id: USER_ID } })).resolves.toMatchObject({
      displayName: 'Updated Person',
    })
  })

  it('rejects invalid updates without changing persistence', async () => {
    await expect(updateProfile.execute(USER_ID, 'x')).rejects.toThrow(InvalidDisplayNameError)
    await expect(prisma.user.findUniqueOrThrow({ where: { id: USER_ID } })).resolves.toMatchObject({
      displayName: 'Initial Person',
    })
  })

  it('does not return or update an inactive profile', async () => {
    await prisma.user.update({ where: { id: USER_ID }, data: { isActive: false } })

    await expect(getProfile.execute(USER_ID)).rejects.toThrow(CurrentUserProfileNotFoundError)
    await expect(updateProfile.execute(USER_ID, 'Updated Person')).rejects.toThrow(
      CurrentUserProfileNotFoundError,
    )
  })
})
