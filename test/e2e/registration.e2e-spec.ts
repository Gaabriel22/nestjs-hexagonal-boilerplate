import { verify } from 'argon2'

import { PrismaService } from '../../src/shared/infrastructure/database/prisma.service'
import type { ProblemDetails } from '../../src/shared/infrastructure/http/problem-details'
import type { ApplicationHarness } from '../support/application-harness'
import { createApplicationHarness } from '../support/application-harness'

const VALID_PASSWORD = 'Registration password 1!'

describe('POST /api/v1/auth/register', () => {
  let harness: ApplicationHarness
  let prisma: PrismaService

  beforeEach(async () => {
    harness = await createApplicationHarness()
    prisma = harness.application.get(PrismaService)
    await prisma.user.deleteMany()
  })

  afterEach(async () => {
    await harness.close()
  })

  it('registers a normalized active user and persists only the password hash', async () => {
    const response = await harness.application.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        email: ' Person@Example.COM ',
        password: VALID_PASSWORD,
      },
    })
    const body = response.json<Record<string, unknown>>()
    const credential = await prisma.credential.findUniqueOrThrow({
      where: { userId: String(body.id) },
    })

    expect(response.statusCode).toBe(201)
    expect(Object.keys(body).sort()).toEqual(['createdAt', 'email', 'id', 'isActive'])
    expect(typeof body.id).toBe('string')
    expect(body.email).toBe('person@example.com')
    expect(body.isActive).toBe(true)
    expect(typeof body.createdAt).toBe('string')
    expect(credential.passwordHash.startsWith('$argon2id$')).toBe(true)
    await expect(verify(credential.passwordHash, VALID_PASSWORD)).resolves.toBe(true)
    expect(JSON.stringify(body)).not.toContain(VALID_PASSWORD)
    expect(JSON.stringify(body)).not.toContain('passwordHash')
  })

  it.each([
    [{ email: 'invalid', password: VALID_PASSWORD }, 'email'],
    [{ email: 'person@example.com', password: 'short' }, 'password'],
    [{ email: 'person@example.com', password: VALID_PASSWORD, unexpected: true }, 'unexpected'],
  ])('rejects invalid input without persistence', async (payload, expectedField) => {
    const response = await harness.application.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload,
    })

    expect(response.statusCode).toBe(400)
    const problem = response.json<ProblemDetails>()

    expect(problem).toMatchObject({
      code: 'request.validation_failed',
    })
    expect(problem.errors?.some(({ field }) => field === expectedField)).toBe(true)
    await expect(prisma.user.count()).resolves.toBe(0)
  })

  it('returns conflict for the same normalized email without leaking credentials', async () => {
    const request = {
      method: 'POST' as const,
      url: '/api/v1/auth/register',
      payload: {
        email: 'person@example.com',
        password: VALID_PASSWORD,
      },
    }

    await harness.application.inject(request)
    const response = await harness.application.inject({
      ...request,
      payload: {
        ...request.payload,
        email: ' PERSON@EXAMPLE.COM ',
      },
    })
    const body = response.json<Record<string, unknown>>()

    expect(response.statusCode).toBe(409)
    expect(body).toMatchObject({
      code: 'identity.email_already_registered',
      status: 409,
    })
    expect(JSON.stringify(body)).not.toContain(VALID_PASSWORD)
    expect(JSON.stringify(body)).not.toContain('argon2')
    await expect(prisma.user.count()).resolves.toBe(1)
    await expect(prisma.credential.count()).resolves.toBe(1)
  })
})
