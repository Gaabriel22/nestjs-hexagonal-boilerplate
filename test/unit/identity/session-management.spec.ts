import { InvalidRefreshTokenError } from '../../../src/identity/application/errors/invalid-refresh-token.error'
import type { AccessTokenService } from '../../../src/identity/application/ports/access-token.service'
import type { RefreshTokenService } from '../../../src/identity/application/ports/refresh-token.service'
import type { SessionManagementRepository } from '../../../src/identity/application/ports/session-management.repository'
import { ListActiveSessions } from '../../../src/identity/application/use-cases/list-active-sessions'
import { LogoutCurrentSession } from '../../../src/identity/application/use-cases/logout-current-session'
import { RefreshSession } from '../../../src/identity/application/use-cases/refresh-session'
import { RevokeOwnedSession } from '../../../src/identity/application/use-cases/revoke-owned-session'
import type { Clock } from '../../../src/shared/application/ports/clock'

const USER_ID = '00000000-0000-4000-8000-000000000401'
const SESSION_ID = '00000000-0000-4000-8000-000000000402'
const OTHER_SESSION_ID = '00000000-0000-4000-8000-000000000403'
const NOW = new Date('2026-01-01T10:00:00.000Z')
const EXPIRES_AT = new Date('2026-02-01T10:00:00.000Z')

describe('RefreshSession', () => {
  let repository: jest.Mocked<SessionManagementRepository>
  let accessTokens: jest.Mocked<AccessTokenService>
  let refreshTokens: jest.Mocked<RefreshTokenService>
  let useCase: RefreshSession

  beforeEach(() => {
    repository = {
      rotateRefreshToken: jest.fn().mockResolvedValue({
        outcome: 'rotated',
        userId: USER_ID,
        sessionId: SESSION_ID,
      }),
      revokeOwnedSession: jest.fn(),
      findActiveSessions: jest.fn(),
    }
    accessTokens = {
      issue: jest.fn().mockResolvedValue({ token: 'new-access-token', expiresInSeconds: 900 }),
      verify: jest.fn(),
    }
    refreshTokens = {
      issue: jest.fn().mockReturnValue({
        token: 'new-refresh-token',
        tokenHash: 'new-refresh-hash',
        expiresAt: EXPIRES_AT,
      }),
      hash: jest.fn().mockReturnValue('old-refresh-hash'),
    }
    useCase = new RefreshSession(repository, accessTokens, refreshTokens, {
      now: (): Date => NOW,
    })
  })

  it('rotates the opaque token and issues minimal access claims', async () => {
    const result = await useCase.execute('old-refresh-token')

    expect(repository.rotateRefreshToken.mock.calls).toEqual([
      [
        {
          presentedTokenHash: 'old-refresh-hash',
          replacementTokenHash: 'new-refresh-hash',
          replacementExpiresAt: EXPIRES_AT,
          currentTime: NOW,
        },
      ],
    ])
    expect(accessTokens.issue.mock.calls).toEqual([[{ userId: USER_ID, sessionId: SESSION_ID }]])
    expect(result).toEqual({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      tokenType: 'Bearer',
      expiresIn: 900,
    })
  })

  it.each(['invalid', 'reused'] as const)(
    'returns one public error for %s tokens',
    async (outcome) => {
      repository.rotateRefreshToken.mockResolvedValue({ outcome })

      await expect(useCase.execute('rejected-token')).rejects.toThrow(InvalidRefreshTokenError)
      expect(accessTokens.issue.mock.calls).toHaveLength(0)
    },
  )
})

describe('Session management use cases', () => {
  const clock: Clock = { now: (): Date => NOW }

  it('revokes current and selected sessions only through owned-session scope', async () => {
    const repository = createRepository()
    const logout = new LogoutCurrentSession(repository, clock)
    const revoke = new RevokeOwnedSession(repository, clock)

    await logout.execute(USER_ID, SESSION_ID)
    await revoke.execute(USER_ID, OTHER_SESSION_ID)

    expect(repository.revokeOwnedSession.mock.calls).toEqual([
      [USER_ID, SESSION_ID, NOW],
      [USER_ID, OTHER_SESSION_ID, NOW],
    ])
  })

  it('marks only the request session as current', async () => {
    const repository = createRepository()
    repository.findActiveSessions.mockResolvedValue([
      {
        id: SESSION_ID,
        deviceLabel: null,
        lastActivityAt: NOW,
        expiresAt: EXPIRES_AT,
        createdAt: NOW,
      },
      {
        id: OTHER_SESSION_ID,
        deviceLabel: 'Laptop',
        lastActivityAt: NOW,
        expiresAt: EXPIRES_AT,
        createdAt: NOW,
      },
    ])

    const result = await new ListActiveSessions(repository, clock).execute(USER_ID, SESSION_ID)

    expect(result.map(({ id, isCurrent }) => ({ id, isCurrent }))).toEqual([
      { id: SESSION_ID, isCurrent: true },
      { id: OTHER_SESSION_ID, isCurrent: false },
    ])
  })
})

function createRepository(): jest.Mocked<SessionManagementRepository> {
  return {
    rotateRefreshToken: jest.fn(),
    revokeOwnedSession: jest.fn().mockResolvedValue(undefined),
    findActiveSessions: jest.fn(),
  }
}
