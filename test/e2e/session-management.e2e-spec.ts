import { Argon2idPasswordHasher } from '../../src/identity/infrastructure/security/argon2id-password-hasher'
import { PrismaService } from '../../src/shared/infrastructure/database/prisma.service'
import type { ApplicationHarness } from '../support/application-harness'
import { createApplicationHarness } from '../support/application-harness'
import { AuthenticationFixtureModule } from './fixtures/authentication.fixture'

const USER_ID = '00000000-0000-4000-8000-000000000601'
const OTHER_USER_ID = '00000000-0000-4000-8000-000000000602'
const FOREIGN_SESSION_ID = '00000000-0000-4000-8000-000000000603'
const UNKNOWN_SESSION_ID = '00000000-0000-4000-8000-000000000604'
const VALID_PASSWORD = 'Session management password 1!'

interface TokenPair {
  readonly accessToken: string
  readonly refreshToken: string
}

describe('renewable session management', () => {
  let harness: ApplicationHarness
  let prisma: PrismaService
  let requestSequence: number

  beforeEach(async () => {
    harness = await createApplicationHarness(AuthenticationFixtureModule)
    prisma = harness.application.get(PrismaService)
    requestSequence = 0
    await prisma.user.deleteMany()
    const passwordHash = await new Argon2idPasswordHasher().hash(VALID_PASSWORD)
    const now = new Date()

    await prisma.user.create({
      data: {
        id: USER_ID,
        normalizedEmail: 'sessions@example.com',
        isActive: true,
        createdAt: now,
        updatedAt: now,
        credential: { create: { passwordHash, createdAt: now, updatedAt: now } },
      },
    })
  })

  afterEach(async () => {
    await harness.close()
  })

  it('rotates once, rejects reuse, and revokes the affected session', async () => {
    const initial = await login()
    const refresh = await harness.application.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      remoteAddress: clientAddress(),
      payload: { refreshToken: initial.refreshToken },
    })
    const replacement = refresh.json<TokenPair>()

    expect(refresh.statusCode).toBe(200)
    expect(typeof replacement.accessToken).toBe('string')
    expect(replacement.refreshToken).not.toBe(initial.refreshToken)

    const reuse = await harness.application.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      remoteAddress: clientAddress(),
      payload: { refreshToken: initial.refreshToken },
    })
    const session = await prisma.session.findFirstOrThrow({ where: { userId: USER_ID } })

    expect(reuse.statusCode).toBe(401)
    expect(reuse.json()).toMatchObject({ code: 'identity.invalid_refresh_token' })
    expect(session.revokedAt).toBeInstanceOf(Date)

    const protectedResponse = await probe(replacement.accessToken)
    expect(protectedResponse.statusCode).toBe(401)
  })

  it('logs out the current session and rejects later access and refresh', async () => {
    const tokens = await login()
    const logout = await harness.application.inject({
      method: 'POST',
      url: '/api/v1/auth/logout',
      remoteAddress: clientAddress(),
      headers: { authorization: `Bearer ${tokens.accessToken}` },
    })

    expect(logout.statusCode).toBe(204)
    expect((await probe(tokens.accessToken)).statusCode).toBe(401)

    const refresh = await harness.application.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      remoteAddress: clientAddress(),
      payload: { refreshToken: tokens.refreshToken },
    })
    expect(refresh.statusCode).toBe(401)
  })

  it('lists safe owned sessions and revokes a selected session', async () => {
    const first = await login()
    const firstSession = await prisma.session.findFirstOrThrow({ where: { userId: USER_ID } })
    const second = await login()
    const secondSession = await prisma.session.findFirstOrThrow({
      where: { userId: USER_ID, id: { not: firstSession.id } },
    })

    const list = await harness.application.inject({
      method: 'GET',
      url: '/api/v1/auth/sessions',
      remoteAddress: clientAddress(),
      headers: { authorization: `Bearer ${first.accessToken}` },
    })
    const body = list.json<{ sessions: Array<Record<string, unknown>> }>()

    expect(list.statusCode).toBe(200)
    expect(body.sessions).toHaveLength(2)
    expect(body.sessions.find(({ id }) => id === firstSession.id)).toMatchObject({
      isCurrent: true,
    })
    expect(JSON.stringify(body)).not.toContain('refreshToken')
    expect(JSON.stringify(body)).not.toContain('tokenHash')

    const revoke = await harness.application.inject({
      method: 'DELETE',
      url: `/api/v1/auth/sessions/${secondSession.id}`,
      remoteAddress: clientAddress(),
      headers: { authorization: `Bearer ${first.accessToken}` },
    })

    expect(revoke.statusCode).toBe(204)
    expect((await probe(second.accessToken)).statusCode).toBe(401)
    expect((await probe(first.accessToken)).statusCode).toBe(200)
  })

  it('conceals foreign and unknown sessions without modifying them', async () => {
    const tokens = await login()
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 86_400_000)

    await prisma.user.create({
      data: {
        id: OTHER_USER_ID,
        normalizedEmail: 'foreign@example.com',
        isActive: true,
        createdAt: now,
        updatedAt: now,
        sessions: {
          create: {
            id: FOREIGN_SESSION_ID,
            refreshTokenHash: 'foreign-refresh-token-hash',
            lastActivityAt: now,
            expiresAt,
            createdAt: now,
            updatedAt: now,
            refreshTokens: {
              create: { tokenHash: 'foreign-refresh-token-hash', issuedAt: now },
            },
          },
        },
      },
    })

    const foreign = await revoke(tokens.accessToken, FOREIGN_SESSION_ID)
    const unknown = await revoke(tokens.accessToken, UNKNOWN_SESSION_ID)

    expect(foreign.statusCode).toBe(204)
    expect(unknown.statusCode).toBe(204)
    await expect(
      prisma.session.findUniqueOrThrow({ where: { id: FOREIGN_SESSION_ID } }),
    ).resolves.toMatchObject({ revokedAt: null })
  })

  async function login(): Promise<TokenPair> {
    const response = await harness.application.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      remoteAddress: clientAddress(),
      payload: { email: 'sessions@example.com', password: VALID_PASSWORD },
    })

    expect(response.statusCode).toBe(200)
    return response.json<TokenPair>()
  }

  async function probe(accessToken: string): Promise<{ readonly statusCode: number }> {
    return harness.application.inject({
      method: 'GET',
      url: '/api/v1/authentication-probe',
      remoteAddress: clientAddress(),
      headers: { authorization: `Bearer ${accessToken}` },
    })
  }

  async function revoke(
    accessToken: string,
    sessionId: string,
  ): Promise<{ readonly statusCode: number }> {
    return harness.application.inject({
      method: 'DELETE',
      url: `/api/v1/auth/sessions/${sessionId}`,
      remoteAddress: clientAddress(),
      headers: { authorization: `Bearer ${accessToken}` },
    })
  }

  function clientAddress(): string {
    requestSequence += 1
    return `192.0.2.${String(requestSequence)}`
  }
})
