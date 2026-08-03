import type { TestingModule } from '@nestjs/testing'
import { Test } from '@nestjs/testing'

import { Credential } from '../../../src/identity/domain/entities/credential'
import { IdentitySession } from '../../../src/identity/domain/entities/identity-session'
import { IdentityUser } from '../../../src/identity/domain/entities/identity-user'
import {
  CREDENTIAL_REPOSITORY,
  type CredentialRepository,
} from '../../../src/identity/domain/repositories/credential.repository'
import {
  SESSION_REPOSITORY,
  type SessionRepository,
} from '../../../src/identity/domain/repositories/session.repository'
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../../src/identity/domain/repositories/user.repository'
import { IdentityModule } from '../../../src/identity/identity.module'
import { ConfigurationModule } from '../../../src/shared/infrastructure/config/configuration.module'
import { DatabaseModule } from '../../../src/shared/infrastructure/database/database.module'
import { PrismaService } from '../../../src/shared/infrastructure/database/prisma.service'

const USER_ID = '00000000-0000-4000-8000-000000000001'
const OTHER_USER_ID = '00000000-0000-4000-8000-000000000002'
const SESSION_ID = '00000000-0000-4000-8000-000000000101'
const OTHER_SESSION_ID = '00000000-0000-4000-8000-000000000102'
const CREATED_AT = new Date('2026-01-01T10:00:00.000Z')
const UPDATED_AT = new Date('2026-01-01T10:05:00.000Z')
const LAST_ACTIVITY_AT = new Date('2026-01-01T11:00:00.000Z')
const EXPIRES_AT = new Date('2026-02-01T10:00:00.000Z')

function restoreUser(id: string, normalizedEmail: string): IdentityUser {
  return IdentityUser.restore({
    id,
    normalizedEmail,
    isActive: true,
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  })
}

function restoreSession(
  id: string,
  userId: string,
  refreshTokenHash: string,
  overrides: Partial<{
    lastActivityAt: Date
    expiresAt: Date
    revokedAt: Date | null
  }> = {},
): IdentitySession {
  return IdentitySession.restore({
    id,
    userId,
    refreshTokenHash,
    deviceLabel: 'Chrome on Windows',
    lastActivityAt: overrides.lastActivityAt ?? LAST_ACTIVITY_AT,
    expiresAt: overrides.expiresAt ?? EXPIRES_AT,
    revokedAt: overrides.revokedAt ?? null,
    createdAt: CREATED_AT,
    updatedAt: UPDATED_AT,
  })
}

describe('Identity persistence', () => {
  let module: TestingModule
  let prisma: PrismaService
  let users: UserRepository
  let credentials: CredentialRepository
  let sessions: SessionRepository

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ConfigurationModule, DatabaseModule, IdentityModule],
    }).compile()
    await module.init()

    prisma = module.get(PrismaService)
    users = module.get(USER_REPOSITORY)
    credentials = module.get(CREDENTIAL_REPOSITORY)
    sessions = module.get(SESSION_REPOSITORY)
  })

  beforeEach(async () => {
    await prisma.user.deleteMany()
  })

  afterAll(async () => {
    await module.close()
  })

  it('enforces unique normalized email storage', async () => {
    await users.save(restoreUser(USER_ID, 'person@example.com'))

    await expect(users.save(restoreUser(OTHER_USER_ID, 'person@example.com'))).rejects.toThrow()
    await expect(users.save(restoreUser(OTHER_USER_ID, ' Person@Example.com '))).rejects.toThrow()

    await expect(prisma.user.count()).resolves.toBe(1)
  })

  it('maps persisted users and credentials back to domain entities', async () => {
    const user = restoreUser(USER_ID, 'person@example.com')
    const credential = Credential.restore({
      userId: USER_ID,
      passwordHash: 'argon2id-hash',
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
    })

    await users.save(user)
    await credentials.save(credential)

    await expect(users.findById(USER_ID)).resolves.toMatchObject({
      id: USER_ID,
      normalizedEmail: 'person@example.com',
      isActive: true,
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
    })
    await expect(credentials.findByUserId(USER_ID)).resolves.toMatchObject({
      userId: USER_ID,
      passwordHash: 'argon2id-hash',
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
    })
  })

  it('looks sessions up by token while preserving activity and expiry fields', async () => {
    await users.save(restoreUser(USER_ID, 'person@example.com'))
    await sessions.save(restoreSession(SESSION_ID, USER_ID, 'refresh-token-hash'))

    await expect(sessions.findByRefreshTokenHash('refresh-token-hash')).resolves.toMatchObject({
      id: SESSION_ID,
      userId: USER_ID,
      deviceLabel: 'Chrome on Windows',
      lastActivityAt: LAST_ACTIVITY_AT,
      expiresAt: EXPIRES_AT,
      revokedAt: null,
      createdAt: CREATED_AT,
      updatedAt: UPDATED_AT,
    })
  })

  it('isolates owned lookup and lists only active sessions for that user', async () => {
    await users.save(restoreUser(USER_ID, 'person@example.com'))
    await users.save(restoreUser(OTHER_USER_ID, 'other@example.com'))
    await sessions.save(restoreSession(SESSION_ID, USER_ID, 'active-token-hash'))
    await sessions.save(
      restoreSession(OTHER_SESSION_ID, OTHER_USER_ID, 'other-token-hash', {
        lastActivityAt: new Date('2026-01-01T12:00:00.000Z'),
      }),
    )
    await sessions.save(
      restoreSession('00000000-0000-4000-8000-000000000103', USER_ID, 'expired-token-hash', {
        expiresAt: new Date('2026-01-01T11:30:00.000Z'),
      }),
    )
    await sessions.save(
      restoreSession('00000000-0000-4000-8000-000000000104', USER_ID, 'revoked-token-hash', {
        revokedAt: new Date('2026-01-01T11:30:00.000Z'),
      }),
    )

    await expect(sessions.findByIdForUser(SESSION_ID, OTHER_USER_ID)).resolves.toBeNull()
    await expect(
      sessions.findActiveByUserId(USER_ID, new Date('2026-01-01T12:00:00.000Z')),
    ).resolves.toMatchObject([{ id: SESSION_ID, userId: USER_ID }])
  })
})
