import { JwtService } from '@nestjs/jwt'

import { Argon2idPasswordHasher } from '../../src/identity/infrastructure/security/argon2id-password-hasher'
import { PrismaService } from '../../src/shared/infrastructure/database/prisma.service'
import type { ApplicationHarness } from '../support/application-harness'
import { createApplicationHarness } from '../support/application-harness'
import { AuthenticationFixtureModule } from './fixtures/authentication.fixture'

const USER_ID = '00000000-0000-4000-8000-000000000401'
const VALID_PASSWORD = 'Authentication password 1!'
const TEST_SECRET = 'test-access-token-secret-at-least-32-characters'

describe('access authentication', () => {
  let harness: ApplicationHarness
  let prisma: PrismaService

  beforeEach(async () => {
    harness = await createApplicationHarness(AuthenticationFixtureModule)
    prisma = harness.application.get(PrismaService)
    await prisma.user.deleteMany()
    const passwordHash = await new Argon2idPasswordHasher().hash(VALID_PASSWORD)
    const now = new Date()

    await prisma.user.create({
      data: {
        id: USER_ID,
        normalizedEmail: 'person@example.com',
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

  it('logs in, stores only the keyed refresh hash, and authenticates the active session', async () => {
    const login = await harness.application.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: ' PERSON@EXAMPLE.COM ', password: VALID_PASSWORD },
    })
    const body = login.json<Record<string, unknown>>()
    const session = await prisma.session.findFirstOrThrow({ where: { userId: USER_ID } })

    expect(login.statusCode).toBe(200)
    expect(body).toMatchObject({ tokenType: 'Bearer', expiresIn: 900 })
    expect(typeof body.accessToken).toBe('string')
    expect(typeof body.refreshToken).toBe('string')
    expect(session.refreshTokenHash).not.toBe(body.refreshToken)
    expect(JSON.stringify(session)).not.toContain(String(body.refreshToken))

    const protectedResponse = await harness.application.inject({
      method: 'GET',
      url: '/api/v1/authentication-probe',
      headers: { authorization: `Bearer ${String(body.accessToken)}` },
    })

    expect(protectedResponse.statusCode).toBe(200)
    expect(protectedResponse.json()).toEqual({ userId: USER_ID, sessionId: session.id })
  })

  it('returns identical public failures for unknown email and invalid password', async () => {
    const wrongPassword = await harness.application.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'person@example.com', password: 'wrong password' },
    })
    const unknownEmail = await harness.application.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'unknown@example.com', password: 'wrong password' },
    })

    expect(wrongPassword.statusCode).toBe(401)
    expect(unknownEmail.statusCode).toBe(401)
    expect(wrongPassword.json()).toMatchObject({
      code: 'identity.invalid_credentials',
      detail: 'Invalid email or password',
    })
    expect(unknownEmail.json()).toMatchObject({
      code: 'identity.invalid_credentials',
      detail: 'Invalid email or password',
    })
  })

  it.each([
    ['missing', undefined],
    ['invalid', 'Bearer invalid-token'],
    [
      'expired',
      `Bearer ${new JwtService().sign(
        { sid: '00000000-0000-4000-8000-000000000499' },
        {
          subject: USER_ID,
          secret: TEST_SECRET,
          expiresIn: -1,
          issuer: 'nestjs-hexagonal-boilerplate',
          audience: 'nestjs-hexagonal-boilerplate-users',
        },
      )}`,
    ],
  ])('rejects %s access token', async (_case, authorization) => {
    const response = await harness.application.inject({
      method: 'GET',
      url: '/api/v1/authentication-probe',
      headers: authorization === undefined ? {} : { authorization },
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toMatchObject({ code: 'identity.invalid_access_token' })
  })
})
