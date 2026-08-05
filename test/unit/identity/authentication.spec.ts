import { InvalidAccessTokenError } from '../../../src/identity/application/errors/invalid-access-token.error'
import type { AccessTokenService } from '../../../src/identity/application/ports/access-token.service'
import type { AuthenticationRepository } from '../../../src/identity/application/ports/authentication.repository'
import type { CredentialAuthenticator } from '../../../src/identity/application/ports/credential-authenticator'
import type { RefreshTokenService } from '../../../src/identity/application/ports/refresh-token.service'
import { AuthenticateAccessToken } from '../../../src/identity/application/use-cases/authenticate-access-token'
import { Login } from '../../../src/identity/application/use-cases/login'
import type { Clock } from '../../../src/shared/application/ports/clock'
import type { IdentifierGenerator } from '../../../src/shared/application/ports/identifier-generator'

const USER_ID = '00000000-0000-4000-8000-000000000301'
const SESSION_ID = '00000000-0000-4000-8000-000000000302'
const AUDIT_EVENT_ID = '00000000-0000-4000-8000-000000000303'
const NOW = new Date('2026-01-01T10:00:00.000Z')

describe('Login', () => {
  let repository: jest.Mocked<AuthenticationRepository>
  let authenticator: jest.Mocked<CredentialAuthenticator>
  let accessTokens: jest.Mocked<AccessTokenService>
  let refreshTokens: jest.Mocked<RefreshTokenService>
  let login: Login

  beforeEach(() => {
    repository = {
      findCredentialIdentity: jest.fn().mockResolvedValue({
        userId: USER_ID,
        normalizedEmail: 'person@example.com',
        isActive: true,
        passwordHash: 'password-hash',
      }),
      createSession: jest.fn().mockResolvedValue(undefined),
      findActiveIdentity: jest.fn(),
    }
    authenticator = { matches: jest.fn().mockResolvedValue(true) }
    accessTokens = {
      issue: jest.fn().mockResolvedValue({ token: 'access-token', expiresInSeconds: 900 }),
      verify: jest.fn(),
    }
    refreshTokens = {
      issue: jest.fn().mockReturnValue({
        token: 'opaque-refresh-token',
        tokenHash: 'keyed-token-hash',
        expiresAt: new Date('2026-02-01T10:00:00.000Z'),
      }),
      hash: jest.fn().mockReturnValue('keyed-token-hash'),
    }
    const generatedIds = [SESSION_ID, AUDIT_EVENT_ID]
    const identifiers: IdentifierGenerator = {
      generate: () => generatedIds.shift() ?? 'unexpected-id',
    }
    const clock: Clock = { now: () => NOW }
    login = new Login(repository, authenticator, accessTokens, refreshTokens, identifiers, clock)
  })

  it('issues minimal access claims and persists only refresh hash', async () => {
    const result = await login.execute({ email: 'PERSON@example.com', password: 'password' })

    expect(result).toMatchObject({
      accessToken: 'access-token',
      refreshToken: 'opaque-refresh-token',
      expiresIn: 900,
    })
    expect(accessTokens.issue.mock.calls).toEqual([[{ userId: USER_ID, sessionId: SESSION_ID }]])
    const session = repository.createSession.mock.calls[0]?.[0]
    const auditEvent = repository.createSession.mock.calls[0]?.[1]
    expect(session?.refreshTokenHash).toBe('keyed-token-hash')
    expect(JSON.stringify(session)).not.toContain('opaque-refresh-token')
    expect(auditEvent?.toPrimitives()).toMatchObject({
      id: AUDIT_EVENT_ID,
      actorUserId: USER_ID,
      action: 'identity.session_created',
      targetId: SESSION_ID,
      metadata: {},
    })
  })

  it.each([
    ['unknown user', null, false],
    [
      'invalid password',
      {
        userId: USER_ID,
        normalizedEmail: 'person@example.com',
        isActive: true,
        passwordHash: 'password-hash',
      },
      false,
    ],
    [
      'inactive user',
      {
        userId: USER_ID,
        normalizedEmail: 'person@example.com',
        isActive: false,
        passwordHash: 'password-hash',
      },
      true,
    ],
  ])('returns same public error for %s', async (_case, identity, matches) => {
    repository.findCredentialIdentity.mockResolvedValue(identity)
    authenticator.matches.mockResolvedValue(matches)

    await expect(
      login.execute({ email: 'person@example.com', password: 'password' }),
    ).rejects.toEqual(
      expect.objectContaining({
        code: 'identity.invalid_credentials',
        message: 'Invalid email or password',
      }),
    )
    expect(authenticator.matches.mock.calls).toEqual([['password', identity?.passwordHash ?? null]])
  })
})

describe('AuthenticateAccessToken', () => {
  it('rejects revoked or expired sessions after token verification', async () => {
    const accessTokens: AccessTokenService = {
      issue: jest.fn(),
      verify: jest.fn().mockResolvedValue({ userId: USER_ID, sessionId: SESSION_ID }),
    }
    const repository: AuthenticationRepository = {
      findCredentialIdentity: jest.fn(),
      createSession: jest.fn(),
      findActiveIdentity: jest.fn().mockResolvedValue(null),
    }
    const useCase = new AuthenticateAccessToken(accessTokens, repository, { now: (): Date => NOW })

    await expect(useCase.execute('access-token')).rejects.toThrow(InvalidAccessTokenError)
  })
})
