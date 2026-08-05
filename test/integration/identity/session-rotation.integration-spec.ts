import type { TestingModule } from '@nestjs/testing'
import { Test } from '@nestjs/testing'

import {
  SESSION_MANAGEMENT_REPOSITORY,
  type SessionManagementRepository,
} from '../../../src/identity/application/ports/session-management.repository'
import { IdentityModule } from '../../../src/identity/identity.module'
import { ConfigurationModule } from '../../../src/shared/infrastructure/config/configuration.module'
import { DatabaseModule } from '../../../src/shared/infrastructure/database/database.module'
import { PrismaService } from '../../../src/shared/infrastructure/database/prisma.service'

const USER_ID = '00000000-0000-4000-8000-000000000501'
const SESSION_ID = '00000000-0000-4000-8000-000000000502'
const NOW = new Date('2026-01-01T10:00:00.000Z')
const EXPIRES_AT = new Date('2026-02-01T10:00:00.000Z')

describe('session refresh rotation', () => {
  let module: TestingModule
  let prisma: PrismaService
  let repository: SessionManagementRepository

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ConfigurationModule, DatabaseModule, IdentityModule],
    }).compile()
    await module.init()

    prisma = module.get(PrismaService)
    repository = module.get(SESSION_MANAGEMENT_REPOSITORY)
  })

  beforeEach(async () => {
    await prisma.user.deleteMany()
    await seedSession('initial-token-hash')
  })

  afterAll(async () => {
    await module.close()
  })

  it('atomically consumes one token and persists its replacement', async () => {
    const result = await repository.rotateRefreshToken({
      presentedTokenHash: 'initial-token-hash',
      replacementTokenHash: 'replacement-token-hash',
      replacementExpiresAt: EXPIRES_AT,
      currentTime: NOW,
      audit: { eventId: '00000000-0000-4000-8000-000000000511' },
    })

    expect(result).toEqual({ outcome: 'rotated', userId: USER_ID, sessionId: SESSION_ID })
    await expect(
      prisma.session.findUniqueOrThrow({ where: { id: SESSION_ID } }),
    ).resolves.toMatchObject({
      refreshTokenHash: 'replacement-token-hash',
      lastActivityAt: NOW,
      expiresAt: EXPIRES_AT,
      revokedAt: null,
    })
    await expect(
      prisma.sessionRefreshToken.findUniqueOrThrow({
        where: { tokenHash: 'initial-token-hash' },
      }),
    ).resolves.toMatchObject({ usedAt: NOW })
    await expect(
      prisma.sessionRefreshToken.findUniqueOrThrow({
        where: { tokenHash: 'replacement-token-hash' },
      }),
    ).resolves.toMatchObject({ usedAt: null })
    await expect(
      prisma.auditEvent.findUniqueOrThrow({
        where: { id: '00000000-0000-4000-8000-000000000511' },
      }),
    ).resolves.toMatchObject({
      actorUserId: USER_ID,
      action: 'identity.refresh_rotated',
      targetId: SESSION_ID,
      metadata: {},
    })
  })

  it('allows one concurrent rotation then detects reuse and revokes the session', async () => {
    const rotations = await Promise.all([
      repository.rotateRefreshToken({
        presentedTokenHash: 'initial-token-hash',
        replacementTokenHash: 'replacement-token-hash-a',
        replacementExpiresAt: EXPIRES_AT,
        currentTime: NOW,
        audit: { eventId: '00000000-0000-4000-8000-000000000512' },
      }),
      repository.rotateRefreshToken({
        presentedTokenHash: 'initial-token-hash',
        replacementTokenHash: 'replacement-token-hash-b',
        replacementExpiresAt: EXPIRES_AT,
        currentTime: new Date(NOW.getTime() + 1),
        audit: { eventId: '00000000-0000-4000-8000-000000000513' },
      }),
    ])

    expect(rotations.map(({ outcome }) => outcome).sort()).toEqual(['reused', 'rotated'])
    const session = await prisma.session.findUniqueOrThrow({ where: { id: SESSION_ID } })
    expect(session.revokedAt).toBeInstanceOf(Date)
    await expect(
      prisma.sessionRefreshToken.count({
        where: {
          tokenHash: { in: ['replacement-token-hash-a', 'replacement-token-hash-b'] },
        },
      }),
    ).resolves.toBe(1)
    await expect(
      prisma.auditEvent.count({
        where: {
          id: {
            in: ['00000000-0000-4000-8000-000000000512', '00000000-0000-4000-8000-000000000513'],
          },
        },
      }),
    ).resolves.toBe(2)
  })

  async function seedSession(tokenHash: string): Promise<void> {
    await prisma.user.create({
      data: {
        id: USER_ID,
        normalizedEmail: 'rotation@example.com',
        isActive: true,
        createdAt: NOW,
        updatedAt: NOW,
        sessions: {
          create: {
            id: SESSION_ID,
            refreshTokenHash: tokenHash,
            lastActivityAt: NOW,
            expiresAt: EXPIRES_AT,
            createdAt: NOW,
            updatedAt: NOW,
            refreshTokens: {
              create: { tokenHash, issuedAt: NOW },
            },
          },
        },
      },
    })
  }
})
