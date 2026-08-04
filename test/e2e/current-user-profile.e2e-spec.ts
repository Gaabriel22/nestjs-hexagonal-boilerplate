import { Argon2idPasswordHasher } from '../../src/identity/infrastructure/security/argon2id-password-hasher'
import { PrismaService } from '../../src/shared/infrastructure/database/prisma.service'
import type { ApplicationHarness } from '../support/application-harness'
import { createApplicationHarness } from '../support/application-harness'

const USER_ID = '00000000-0000-4000-8000-000000000901'
const VALID_PASSWORD = 'Current profile password 1!'

describe('current user profile', () => {
  let harness: ApplicationHarness
  let prisma: PrismaService

  beforeEach(async () => {
    harness = await createApplicationHarness()
    prisma = harness.application.get(PrismaService)
    await prisma.user.deleteMany()
    const passwordHash = await new Argon2idPasswordHasher().hash(VALID_PASSWORD)
    const now = new Date()

    await prisma.user.create({
      data: {
        id: USER_ID,
        normalizedEmail: 'profile@example.com',
        displayName: 'Initial Person',
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

  it('returns only the safe current-user profile', async () => {
    const accessToken = await login()
    const response = await harness.application.inject({
      method: 'GET',
      url: '/api/v1/users/me',
      headers: { authorization: `Bearer ${accessToken}` },
    })
    const body = response.json<Record<string, unknown>>()

    expect(response.statusCode).toBe(200)
    expect(Object.keys(body).sort()).toEqual([
      'createdAt',
      'displayName',
      'email',
      'id',
      'isActive',
      'updatedAt',
    ])
    expect(body).toMatchObject({
      id: USER_ID,
      email: 'profile@example.com',
      displayName: 'Initial Person',
      isActive: true,
    })
    expect(JSON.stringify(body)).not.toMatch(/password|credential|session|token|normalizedEmail/i)
  })

  it('normalizes and persists a supported profile update', async () => {
    const accessToken = await login()
    const response = await harness.application.inject({
      method: 'PATCH',
      url: '/api/v1/users/me',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { displayName: '  Updated   Person  ' },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({
      id: USER_ID,
      displayName: 'Updated Person',
    })
    await expect(prisma.user.findUniqueOrThrow({ where: { id: USER_ID } })).resolves.toMatchObject({
      displayName: 'Updated Person',
    })
  })

  it.each([
    ['invalid value', { displayName: 'x' }],
    ['immutable field', { displayName: 'Valid Person', isActive: false }],
    ['unknown field', { displayName: 'Valid Person', unexpected: true }],
  ])('rejects %s without changing the profile', async (_case, payload) => {
    const accessToken = await login()
    const response = await harness.application.inject({
      method: 'PATCH',
      url: '/api/v1/users/me',
      headers: { authorization: `Bearer ${accessToken}` },
      payload,
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toMatchObject({ code: 'request.validation_failed' })
    await expect(prisma.user.findUniqueOrThrow({ where: { id: USER_ID } })).resolves.toMatchObject({
      displayName: 'Initial Person',
      isActive: true,
    })
  })

  it('rejects unauthenticated profile access', async () => {
    const response = await harness.application.inject({
      method: 'GET',
      url: '/api/v1/users/me',
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toMatchObject({ code: 'identity.invalid_access_token' })
  })

  it('rejects a deactivated user despite an unexpired access token', async () => {
    const accessToken = await login()
    await prisma.user.update({ where: { id: USER_ID }, data: { isActive: false } })

    const response = await harness.application.inject({
      method: 'GET',
      url: '/api/v1/users/me',
      headers: { authorization: `Bearer ${accessToken}` },
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toMatchObject({ code: 'identity.invalid_access_token' })
  })

  async function login(): Promise<string> {
    const response = await harness.application.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'profile@example.com', password: VALID_PASSWORD },
    })

    expect(response.statusCode).toBe(200)
    return String(response.json<{ accessToken: string }>().accessToken)
  }
})
