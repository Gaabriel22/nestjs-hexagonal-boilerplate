import type { LightMyRequestResponse } from 'fastify'

import type { Prisma } from '../../src/generated/prisma/client'
import { Argon2idPasswordHasher } from '../../src/identity/infrastructure/security/argon2id-password-hasher'
import { PrismaService } from '../../src/shared/infrastructure/database/prisma.service'
import type { ApplicationHarness } from '../support/application-harness'
import { createApplicationHarness } from '../support/application-harness'

const OWNER_ID = '00000000-0000-4000-8000-000000001601'
const SECOND_OWNER_ID = '00000000-0000-4000-8000-000000001602'
const ADMIN_ID = '00000000-0000-4000-8000-000000001603'
const MEMBER_ID = '00000000-0000-4000-8000-000000001604'
const OTHER_ID = '00000000-0000-4000-8000-000000001605'
const ORGANIZATION_ID = '00000000-0000-4000-8000-000000001611'
const OTHER_ORGANIZATION_ID = '00000000-0000-4000-8000-000000001612'
const OWNER_MEMBERSHIP_ID = '00000000-0000-4000-8000-000000001621'
const SECOND_OWNER_MEMBERSHIP_ID = '00000000-0000-4000-8000-000000001622'
const ADMIN_MEMBERSHIP_ID = '00000000-0000-4000-8000-000000001623'
const MEMBER_MEMBERSHIP_ID = '00000000-0000-4000-8000-000000001624'
const OTHER_MEMBERSHIP_ID = '00000000-0000-4000-8000-000000001625'
const VALID_PASSWORD = 'Membership administration password 1!'

describe('membership administration', () => {
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
      createUser(OWNER_ID, 'membership-owner@example.com', passwordHash, now),
      createUser(SECOND_OWNER_ID, 'membership-second-owner@example.com', passwordHash, now),
      createUser(ADMIN_ID, 'membership-admin@example.com', passwordHash, now),
      createUser(MEMBER_ID, 'membership-member@example.com', passwordHash, now),
      createUser(OTHER_ID, 'membership-other@example.com', passwordHash, now),
    ])
    await prisma.organization.createMany({
      data: [
        organization(ORGANIZATION_ID, 'Administered Organization', now),
        organization(OTHER_ORGANIZATION_ID, 'Foreign Organization', now),
      ],
    })
    await prisma.membership.createMany({
      data: [
        membership(OWNER_MEMBERSHIP_ID, ORGANIZATION_ID, OWNER_ID, 'owner', now),
        membership(SECOND_OWNER_MEMBERSHIP_ID, ORGANIZATION_ID, SECOND_OWNER_ID, 'owner', now),
        membership(ADMIN_MEMBERSHIP_ID, ORGANIZATION_ID, ADMIN_ID, 'admin', now),
        membership(MEMBER_MEMBERSHIP_ID, ORGANIZATION_ID, MEMBER_ID, 'member', now),
        membership(OTHER_MEMBERSHIP_ID, OTHER_ORGANIZATION_ID, OTHER_ID, 'member', now),
      ],
    })
  })

  afterEach(async () => {
    await harness.close()
  })

  it('lets an admin change a member between supported non-owner roles', async () => {
    const token = await login('membership-admin@example.com')
    const response = await changeRole(token, MEMBER_MEMBERSHIP_ID, 'admin')

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({ id: MEMBER_MEMBERSHIP_ID, role: 'admin' })
    await expect(
      prisma.membership.findUniqueOrThrow({ where: { id: MEMBER_MEMBERSHIP_ID } }),
    ).resolves.toMatchObject({ role: 'admin', isActive: true })
  })

  it('rejects member administration without permission', async () => {
    const token = await login('membership-member@example.com')
    const response = await changeRole(token, ADMIN_MEMBERSHIP_ID, 'member')

    expect(response.statusCode).toBe(403)
    expect(response.json()).toMatchObject({ code: 'organization.access_denied' })
  })

  it('uses current persisted actor role instead of stale token state', async () => {
    const token = await login('membership-admin@example.com')
    await prisma.membership.update({
      where: { id: ADMIN_MEMBERSHIP_ID },
      data: { role: 'member' },
    })
    const response = await changeRole(token, MEMBER_MEMBERSHIP_ID, 'admin')

    expect(response.statusCode).toBe(403)
    await expect(
      prisma.membership.findUniqueOrThrow({ where: { id: MEMBER_MEMBERSHIP_ID } }),
    ).resolves.toMatchObject({ role: 'member' })
  })

  it('rejects owner role assignment at the DTO boundary', async () => {
    const token = await login('membership-owner@example.com')
    const response = await harness.application.inject({
      method: 'PATCH',
      url: roleUrl(MEMBER_MEMBERSHIP_ID),
      headers: { authorization: `Bearer ${token}` },
      payload: { role: 'owner' },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toMatchObject({ code: 'request.validation_failed' })
  })

  it('removes membership and denies access immediately', async () => {
    const ownerToken = await login('membership-owner@example.com')
    const removal = await remove(ownerToken, MEMBER_MEMBERSHIP_ID)

    expect(removal.statusCode).toBe(204)
    await harness.close()
    harness = await createApplicationHarness()
    prisma = harness.application.get(PrismaService)
    const memberToken = await login('membership-member@example.com')
    const access = await harness.application.inject({
      method: 'GET',
      url: `/api/v1/organizations/${ORGANIZATION_ID}/memberships`,
      headers: { authorization: `Bearer ${memberToken}` },
    })

    expect(access.statusCode).toBe(403)
    expect(access.json()).toMatchObject({ code: 'organization.access_denied' })
  })

  it('protects the last active owner', async () => {
    await prisma.membership.update({
      where: { id: SECOND_OWNER_MEMBERSHIP_ID },
      data: { isActive: false },
    })
    const token = await login('membership-owner@example.com')
    const response = await remove(token, OWNER_MEMBERSHIP_ID)

    expect(response.statusCode).toBe(409)
    expect(response.json()).toMatchObject({ code: 'organization.last_owner_required' })
    await expect(
      prisma.membership.findUniqueOrThrow({ where: { id: OWNER_MEMBERSHIP_ID } }),
    ).resolves.toMatchObject({ isActive: true })
  })

  it('lets an owner remove another owner while one remains', async () => {
    const token = await login('membership-owner@example.com')
    const response = await remove(token, SECOND_OWNER_MEMBERSHIP_ID)

    expect(response.statusCode).toBe(204)
    await expect(
      prisma.membership.findUniqueOrThrow({ where: { id: SECOND_OWNER_MEMBERSHIP_ID } }),
    ).resolves.toMatchObject({ isActive: false })
  })

  it('forbids an admin from removing an owner', async () => {
    const token = await login('membership-admin@example.com')
    const response = await remove(token, OWNER_MEMBERSHIP_ID)

    expect(response.statusCode).toBe(403)
    expect(response.json()).toMatchObject({ code: 'organization.access_denied' })
  })

  it('conceals a cross-tenant membership identifier', async () => {
    const token = await login('membership-owner@example.com')
    const response = await changeRole(token, OTHER_MEMBERSHIP_ID, 'admin')

    expect(response.statusCode).toBe(404)
    expect(response.json()).toMatchObject({ code: 'organization.membership_not_found' })
  })

  function createUser(
    id: string,
    email: string,
    passwordHash: string,
    now: Date,
  ): Promise<unknown> {
    return prisma.user.create({
      data: {
        id,
        normalizedEmail: email,
        isActive: true,
        createdAt: now,
        updatedAt: now,
        credential: { create: { passwordHash, createdAt: now, updatedAt: now } },
      },
    })
  }

  function organization(id: string, name: string, now: Date): Prisma.OrganizationCreateManyInput {
    return { id, name, isActive: true, createdAt: now, updatedAt: now }
  }

  function membership(
    id: string,
    organizationId: string,
    userId: string,
    role: 'owner' | 'admin' | 'member',
    now: Date,
  ): Prisma.MembershipCreateManyInput {
    return { id, organizationId, userId, role, isActive: true, createdAt: now, updatedAt: now }
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

  function roleUrl(membershipId: string): string {
    return `/api/v1/organizations/${ORGANIZATION_ID}/memberships/${membershipId}/role`
  }

  function changeRole(
    token: string,
    membershipId: string,
    role: 'admin' | 'member',
  ): Promise<LightMyRequestResponse> {
    return harness.application.inject({
      method: 'PATCH',
      url: roleUrl(membershipId),
      headers: { authorization: `Bearer ${token}` },
      payload: { role },
    })
  }

  function remove(token: string, membershipId: string): Promise<LightMyRequestResponse> {
    return harness.application.inject({
      method: 'DELETE',
      url: `/api/v1/organizations/${ORGANIZATION_ID}/memberships/${membershipId}`,
      headers: { authorization: `Bearer ${token}` },
    })
  }
})
