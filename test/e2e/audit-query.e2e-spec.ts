import { randomUUID } from 'node:crypto'

import type { LightMyRequestResponse } from 'fastify'

import { Argon2idPasswordHasher } from '../../src/identity/infrastructure/security/argon2id-password-hasher'
import { PrismaService } from '../../src/shared/infrastructure/database/prisma.service'
import type { ApplicationHarness } from '../support/application-harness'
import { createApplicationHarness } from '../support/application-harness'

const VALID_PASSWORD = 'Audit query password 1!'

interface AuditEventListBody {
  readonly events: readonly {
    readonly id: string
    readonly actorUserId: string
    readonly organizationId: string
    readonly action: string
    readonly targetType: string
    readonly targetId: string
    readonly requestIdentifier: string | null
    readonly metadata: Readonly<Record<string, unknown>>
    readonly occurredAt: string
  }[]
  readonly nextCursor: string | null
}

describe('organization audit queries', () => {
  let harness: ApplicationHarness
  let prisma: PrismaService
  let organizationId: string
  let eventId: string
  let ownerEmail: string
  let adminEmail: string
  let memberEmail: string
  let outsiderEmail: string

  beforeEach(async () => {
    harness = await createApplicationHarness()
    prisma = harness.application.get(PrismaService)
    organizationId = randomUUID()
    eventId = randomUUID()
    const ownerId = randomUUID()
    const adminId = randomUUID()
    const memberId = randomUUID()
    const outsiderId = randomUUID()
    const suffix = randomUUID()
    ownerEmail = `audit-owner-${suffix}@example.com`
    adminEmail = `audit-admin-${suffix}@example.com`
    memberEmail = `audit-member-${suffix}@example.com`
    outsiderEmail = `audit-outsider-${suffix}@example.com`
    const passwordHash = await new Argon2idPasswordHasher().hash(VALID_PASSWORD)
    const now = new Date('2026-01-01T10:00:00.000Z')

    await Promise.all([
      createUser(ownerId, ownerEmail, passwordHash, now),
      createUser(adminId, adminEmail, passwordHash, now),
      createUser(memberId, memberEmail, passwordHash, now),
      createUser(outsiderId, outsiderEmail, passwordHash, now),
    ])
    await prisma.organization.create({
      data: {
        id: organizationId,
        name: 'Audit Query Organization',
        isActive: true,
        createdAt: now,
        updatedAt: now,
        memberships: {
          create: [
            { id: randomUUID(), userId: ownerId, role: 'owner', createdAt: now, updatedAt: now },
            { id: randomUUID(), userId: adminId, role: 'admin', createdAt: now, updatedAt: now },
            { id: randomUUID(), userId: memberId, role: 'member', createdAt: now, updatedAt: now },
          ],
        },
      },
    })
    await prisma.auditEvent.create({
      data: {
        id: eventId,
        actorUserId: ownerId,
        organizationId,
        action: 'organization.membership_role_changed',
        targetType: 'membership',
        targetId: randomUUID(),
        requestIdentifier: 'request-audit-query',
        metadata: {
          previousRole: 'member',
          role: 'admin',
          password: 'must-not-leak',
          nested: { unrestricted: true },
        },
        occurredAt: now,
      },
    })
  })

  afterEach(async () => {
    await harness.close()
  })

  it('returns tenant audit events to an owner with an explicitly safe response', async () => {
    const accessToken = await login(ownerEmail)
    const response = await listAuditEvents(
      accessToken,
      '?action=organization.membership_role_changed&targetType=membership',
    )
    const body = response.json<AuditEventListBody>()

    expect(response.statusCode).toBe(200)
    expect(body.events).toHaveLength(1)
    expect(body.events[0]).toEqual(
      expect.objectContaining({
        id: eventId,
        organizationId,
        action: 'organization.membership_role_changed',
        metadata: { previousRole: 'member', role: 'admin' },
      }),
    )
    expect(body.nextCursor).toBeNull()
    expect(JSON.stringify(body)).not.toMatch(/password|credential|authorization|cookie|nested/i)
  })

  it('allows an active administrator with audit-read permission', async () => {
    const accessToken = await login(adminEmail)
    const response = await listAuditEvents(accessToken)

    expect(response.statusCode).toBe(200)
    expect(response.json<AuditEventListBody>().events.map(({ id }) => id)).toContain(eventId)
  })

  it.each([
    ['member without permission', (): string => memberEmail],
    ['user without membership', (): string => outsiderEmail],
  ])('conceals audit resources from %s', async (_case, getEmail) => {
    const accessToken = await login(getEmail())
    const response = await listAuditEvents(accessToken)
    const body = response.json<Record<string, unknown>>()

    expect(response.statusCode).toBe(403)
    expect(body).toMatchObject({ code: 'organization.access_denied' })
    expect(body).not.toHaveProperty('events')
    expect(body).not.toHaveProperty('action')
    expect(body).not.toHaveProperty('targetId')
    expect(body).not.toHaveProperty('requestIdentifier')
  })

  it('rejects unsupported audit filters at the HTTP boundary', async () => {
    const accessToken = await login(ownerEmail)
    const response = await listAuditEvents(accessToken, '?action=organization.secret_exported')

    expect(response.statusCode).toBe(400)
    expect(response.json()).toMatchObject({ code: 'request.validation_failed' })
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

  async function login(email: string): Promise<string> {
    const response = await harness.application.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { email, password: VALID_PASSWORD },
    })

    expect(response.statusCode).toBe(200)
    return response.json<{ accessToken: string }>().accessToken
  }

  function listAuditEvents(accessToken: string, query = ''): Promise<LightMyRequestResponse> {
    return harness.application.inject({
      method: 'GET',
      url: `/api/v1/organizations/${organizationId}/audit-events${query}`,
      headers: { authorization: `Bearer ${accessToken}` },
    })
  }
})
