import { Argon2idPasswordHasher } from '../../src/identity/infrastructure/security/argon2id-password-hasher'
import { PrismaService } from '../../src/shared/infrastructure/database/prisma.service'
import type { ApplicationHarness } from '../support/application-harness'
import { createApplicationHarness } from '../support/application-harness'

const USER_ID = '00000000-0000-4000-8000-000000001201'
const VALID_PASSWORD = 'Organization creation password 1!'

describe('organization creation', () => {
  let harness: ApplicationHarness
  let prisma: PrismaService

  beforeEach(async () => {
    harness = await createApplicationHarness()
    prisma = harness.application.get(PrismaService)
    await prisma.membership.deleteMany()
    await prisma.organization.deleteMany()
    await prisma.user.deleteMany()
    const passwordHash = await new Argon2idPasswordHasher().hash(VALID_PASSWORD)
    const now = new Date()

    await prisma.user.create({
      data: {
        id: USER_ID,
        normalizedEmail: 'owner@example.com',
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

  it('creates an organization and active owner with a safe response', async () => {
    const accessToken = await login()
    const response = await harness.application.inject({
      method: 'POST',
      url: '/api/v1/organizations',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { name: '  Example   Company  ' },
    })
    const body = response.json<{
      id: string
      name: string
      ownerMembership: { id: string; userId: string; role: string; isActive: boolean }
    }>()
    const membership = await prisma.membership.findUniqueOrThrow({
      where: {
        organizationId_userId: {
          organizationId: body.id,
          userId: USER_ID,
        },
      },
    })

    expect(response.statusCode).toBe(201)
    expect(body).toMatchObject({
      name: 'Example Company',
      isActive: true,
      ownerMembership: {
        userId: USER_ID,
        role: 'owner',
        isActive: true,
      },
    })
    expect(body.ownerMembership).toMatchObject({
      id: membership.id,
      userId: USER_ID,
      role: 'owner',
      isActive: true,
    })
    expect(JSON.stringify(body)).not.toMatch(/password|credential|token|session/i)
    await expect(prisma.organization.count()).resolves.toBe(1)
    await expect(prisma.membership.count()).resolves.toBe(1)
  })

  it.each([
    ['missing name', {}],
    ['short name', { name: 'x' }],
    ['unknown field', { name: 'Example Company', unexpected: true }],
  ])('rejects %s without persistence', async (_case, payload) => {
    const accessToken = await login()
    const response = await harness.application.inject({
      method: 'POST',
      url: '/api/v1/organizations',
      headers: { authorization: `Bearer ${accessToken}` },
      payload,
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toMatchObject({ code: 'request.validation_failed' })
    await expect(prisma.organization.count()).resolves.toBe(0)
    await expect(prisma.membership.count()).resolves.toBe(0)
  })

  it('rejects unauthenticated creation', async () => {
    const response = await harness.application.inject({
      method: 'POST',
      url: '/api/v1/organizations',
      payload: { name: 'Example Company' },
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toMatchObject({ code: 'identity.invalid_access_token' })
    await expect(prisma.organization.count()).resolves.toBe(0)
  })

  it('rejects a deactivated creator before persistence', async () => {
    const accessToken = await login()
    await prisma.user.update({ where: { id: USER_ID }, data: { isActive: false } })

    const response = await harness.application.inject({
      method: 'POST',
      url: '/api/v1/organizations',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: { name: 'Example Company' },
    })

    expect(response.statusCode).toBe(401)
    await expect(prisma.organization.count()).resolves.toBe(0)
    await expect(prisma.membership.count()).resolves.toBe(0)
  })

  async function login(): Promise<string> {
    const response = await harness.application.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email: 'owner@example.com', password: VALID_PASSWORD },
    })

    expect(response.statusCode).toBe(200)
    return response.json<{ accessToken: string }>().accessToken
  }
})
