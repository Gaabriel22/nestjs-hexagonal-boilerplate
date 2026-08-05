import type { LightMyRequestResponse } from 'fastify'

import type { Prisma } from '../../src/generated/prisma/client'
import { Argon2idPasswordHasher } from '../../src/identity/infrastructure/security/argon2id-password-hasher'
import { PrismaService } from '../../src/shared/infrastructure/database/prisma.service'
import type { ApplicationHarness } from '../support/application-harness'
import { createApplicationHarness } from '../support/application-harness'

const OWNER_ID = '00000000-0000-4000-8000-000000001401'
const MEMBER_ID = '00000000-0000-4000-8000-000000001402'
const INACTIVE_MEMBER_ID = '00000000-0000-4000-8000-000000001403'
const OTHER_OWNER_ID = '00000000-0000-4000-8000-000000001404'
const ORGANIZATION_ID = '00000000-0000-4000-8000-000000001411'
const OTHER_ORGANIZATION_ID = '00000000-0000-4000-8000-000000001412'
const OWNER_MEMBERSHIP_ID = '00000000-0000-4000-8000-000000001421'
const MEMBER_MEMBERSHIP_ID = '00000000-0000-4000-8000-000000001422'
const INACTIVE_MEMBERSHIP_ID = '00000000-0000-4000-8000-000000001423'
const OTHER_MEMBERSHIP_ID = '00000000-0000-4000-8000-000000001424'
const VALID_PASSWORD = 'Organization access password 1!'

interface MembershipListBody {
  readonly memberships: readonly {
    readonly id: string
    readonly userId: string
    readonly role: string
    readonly createdAt: string
    readonly updatedAt: string
  }[]
  readonly nextCursor: string | null
}

describe('organization membership access', () => {
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

    await Promise.all([
      createUser(OWNER_ID, 'access-owner@example.com', passwordHash, now),
      createUser(MEMBER_ID, 'access-member@example.com', passwordHash, now),
      createUser(INACTIVE_MEMBER_ID, 'access-inactive@example.com', passwordHash, now),
      createUser(OTHER_OWNER_ID, 'access-other@example.com', passwordHash, now),
    ])
    await prisma.organization.createMany({
      data: [
        {
          id: ORGANIZATION_ID,
          name: 'Access Organization',
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: OTHER_ORGANIZATION_ID,
          name: 'Other Organization',
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
      ],
    })
    await prisma.membership.createMany({
      data: [
        membership(OWNER_MEMBERSHIP_ID, ORGANIZATION_ID, OWNER_ID, 'owner', true, now),
        membership(MEMBER_MEMBERSHIP_ID, ORGANIZATION_ID, MEMBER_ID, 'member', true, now),
        membership(
          INACTIVE_MEMBERSHIP_ID,
          ORGANIZATION_ID,
          INACTIVE_MEMBER_ID,
          'admin',
          false,
          now,
        ),
        membership(OTHER_MEMBERSHIP_ID, OTHER_ORGANIZATION_ID, OTHER_OWNER_ID, 'owner', true, now),
      ],
    })
  })

  afterEach(async () => {
    await harness.close()
  })

  it('lists only active memberships from requested organization', async () => {
    const accessToken = await login('access-owner@example.com')
    const response = await listMemberships(ORGANIZATION_ID, accessToken)
    const body = response.json<MembershipListBody>()

    expect(response.statusCode).toBe(200)
    expect(body.memberships.map(({ id }) => id)).toEqual([
      OWNER_MEMBERSHIP_ID,
      MEMBER_MEMBERSHIP_ID,
    ])
    expect(body.nextCursor).toBeNull()
    expect(JSON.stringify(body)).not.toMatch(/organizationId|email|password|credential|token/i)
  })

  it('allows active member through persisted membership permission', async () => {
    const accessToken = await login('access-member@example.com')
    const response = await listMemberships(ORGANIZATION_ID, accessToken)

    expect(response.statusCode).toBe(200)
  })

  it.each([
    ['unrelated organization', OTHER_OWNER_ID, 'access-other@example.com', ORGANIZATION_ID],
    ['cross-tenant organization id', OWNER_ID, 'access-owner@example.com', OTHER_ORGANIZATION_ID],
    ['inactive membership', INACTIVE_MEMBER_ID, 'access-inactive@example.com', ORGANIZATION_ID],
  ])(
    'denies %s without exposing membership data',
    async (_case, _userId, email, organizationId) => {
      const accessToken = await login(email)
      const response = await listMemberships(organizationId, accessToken)

      expect(response.statusCode).toBe(403)
      expect(response.json()).toMatchObject({ code: 'organization.access_denied' })
      expect(JSON.stringify(response.json())).not.toMatch(/"memberships":|"userId":/i)
    },
  )

  it.each([
    ['invalid organization id', '/api/v1/organizations/not-a-uuid/memberships'],
    ['invalid cursor', `?cursor=${OWNER_ID.slice(0, -1)}`],
    ['excessive limit', '?limit=101'],
  ])('rejects %s at HTTP boundary', async (_case, target) => {
    const accessToken = await login('access-owner@example.com')
    const url = target.startsWith('/')
      ? target
      : `/api/v1/organizations/${ORGANIZATION_ID}/memberships${target}`
    const response = await harness.application.inject({
      method: 'GET',
      url,
      headers: { authorization: `Bearer ${accessToken}` },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toMatchObject({ code: 'request.validation_failed' })
  })

  it('rejects unauthenticated membership listing', async () => {
    const response = await harness.application.inject({
      method: 'GET',
      url: `/api/v1/organizations/${ORGANIZATION_ID}/memberships`,
    })

    expect(response.statusCode).toBe(401)
    expect(response.json()).toMatchObject({ code: 'identity.invalid_access_token' })
  })

  function createUser(
    id: string,
    normalizedEmail: string,
    passwordHash: string,
    now: Date,
  ): Promise<unknown> {
    return prisma.user.create({
      data: {
        id,
        normalizedEmail,
        isActive: true,
        createdAt: now,
        updatedAt: now,
        credential: { create: { passwordHash, createdAt: now, updatedAt: now } },
      },
    })
  }

  function membership(
    id: string,
    organizationId: string,
    userId: string,
    role: 'owner' | 'admin' | 'member',
    isActive: boolean,
    now: Date,
  ): Prisma.MembershipCreateManyInput {
    return {
      id,
      organizationId,
      userId,
      role,
      isActive,
      createdAt: now,
      updatedAt: now,
    }
  }

  async function login(email: string): Promise<string> {
    const response = await harness.application.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email, password: VALID_PASSWORD },
    })

    expect(response.statusCode).toBe(200)
    return response.json<{ accessToken: string }>().accessToken
  }

  function listMemberships(
    organizationId: string,
    accessToken: string,
  ): Promise<LightMyRequestResponse> {
    return harness.application.inject({
      method: 'GET',
      url: `/api/v1/organizations/${organizationId}/memberships`,
      headers: { authorization: `Bearer ${accessToken}` },
    })
  }
})
