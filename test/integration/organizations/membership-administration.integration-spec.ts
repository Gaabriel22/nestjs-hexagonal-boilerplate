import type { TestingModule } from '@nestjs/testing'
import { Test } from '@nestjs/testing'

import type { Prisma } from '../../../src/generated/prisma/client'
import { LastOwnerRequiredError } from '../../../src/organizations/application/errors/last-owner-required.error'
import { OrganizationAccessDeniedError } from '../../../src/organizations/application/errors/organization-access-denied.error'
import { OrganizationMembershipNotFoundError } from '../../../src/organizations/application/errors/organization-membership-not-found.error'
import { OwnerMembershipProtectedError } from '../../../src/organizations/application/errors/owner-membership-protected.error'
import {
  ORGANIZATION_ACCESS_REPOSITORY,
  type OrganizationAccessRepository,
} from '../../../src/organizations/application/ports/organization-access.repository'
import { ChangeOrganizationMembershipRole } from '../../../src/organizations/application/use-cases/change-organization-membership-role'
import { RemoveOrganizationMembership } from '../../../src/organizations/application/use-cases/remove-organization-membership'
import { OrganizationsModule } from '../../../src/organizations/organizations.module'
import { ConfigurationModule } from '../../../src/shared/infrastructure/config/configuration.module'
import { DatabaseModule } from '../../../src/shared/infrastructure/database/database.module'
import { PrismaService } from '../../../src/shared/infrastructure/database/prisma.service'

const OWNER_ID = '00000000-0000-4000-8000-000000001511'
const SECOND_OWNER_ID = '00000000-0000-4000-8000-000000001512'
const ADMIN_ID = '00000000-0000-4000-8000-000000001513'
const MEMBER_ID = '00000000-0000-4000-8000-000000001514'
const OTHER_ID = '00000000-0000-4000-8000-000000001515'
const ORGANIZATION_ID = '00000000-0000-4000-8000-000000001521'
const OTHER_ORGANIZATION_ID = '00000000-0000-4000-8000-000000001522'
const OWNER_MEMBERSHIP_ID = '00000000-0000-4000-8000-000000001531'
const SECOND_OWNER_MEMBERSHIP_ID = '00000000-0000-4000-8000-000000001532'
const ADMIN_MEMBERSHIP_ID = '00000000-0000-4000-8000-000000001533'
const MEMBER_MEMBERSHIP_ID = '00000000-0000-4000-8000-000000001534'
const OTHER_MEMBERSHIP_ID = '00000000-0000-4000-8000-000000001535'
const NOW = new Date('2026-01-01T10:00:00.000Z')

describe('membership administration persistence', () => {
  let module: TestingModule
  let prisma: PrismaService
  let accessRepository: OrganizationAccessRepository
  let changeRole: ChangeOrganizationMembershipRole
  let removeMembership: RemoveOrganizationMembership

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ConfigurationModule, DatabaseModule, OrganizationsModule],
    }).compile()
    await module.init()

    prisma = module.get(PrismaService)
    accessRepository = module.get(ORGANIZATION_ACCESS_REPOSITORY)
    changeRole = module.get(ChangeOrganizationMembershipRole)
    removeMembership = module.get(RemoveOrganizationMembership)
  })

  beforeEach(async () => {
    await prisma.membership.deleteMany()
    await prisma.organization.deleteMany()
    await prisma.user.deleteMany()
    await prisma.user.createMany({
      data: [OWNER_ID, SECOND_OWNER_ID, ADMIN_ID, MEMBER_ID, OTHER_ID].map((id, index) => ({
        id,
        normalizedEmail: `membership-admin-${String(index)}@example.com`,
        isActive: true,
        createdAt: NOW,
        updatedAt: NOW,
      })),
    })
    await prisma.organization.createMany({
      data: [
        organization(ORGANIZATION_ID, 'Managed Organization'),
        organization(OTHER_ORGANIZATION_ID, 'Other Organization'),
      ],
    })
    await prisma.membership.createMany({
      data: [
        membership(OWNER_MEMBERSHIP_ID, ORGANIZATION_ID, OWNER_ID, 'owner'),
        membership(SECOND_OWNER_MEMBERSHIP_ID, ORGANIZATION_ID, SECOND_OWNER_ID, 'owner'),
        membership(ADMIN_MEMBERSHIP_ID, ORGANIZATION_ID, ADMIN_ID, 'admin'),
        membership(MEMBER_MEMBERSHIP_ID, ORGANIZATION_ID, MEMBER_ID, 'member'),
        membership(OTHER_MEMBERSHIP_ID, OTHER_ORGANIZATION_ID, OTHER_ID, 'member'),
      ],
    })
  })

  afterAll(async () => {
    await module.close()
  })

  it('changes supported non-owner roles and persists the current result', async () => {
    const auditCountBefore = await prisma.auditEvent.count({
      where: {
        organizationId: ORGANIZATION_ID,
        action: 'organization.membership_role_changed',
        targetId: MEMBER_MEMBERSHIP_ID,
      },
    })
    const result = await changeRole.execute({
      organizationId: ORGANIZATION_ID,
      actorUserId: OWNER_ID,
      membershipId: MEMBER_MEMBERSHIP_ID,
      role: 'admin',
    })

    expect(result).toMatchObject({ id: MEMBER_MEMBERSHIP_ID, role: 'admin' })
    await expect(
      prisma.membership.findUniqueOrThrow({ where: { id: MEMBER_MEMBERSHIP_ID } }),
    ).resolves.toMatchObject({ role: 'admin', isActive: true })
    await expect(
      prisma.auditEvent.findMany({
        where: {
          organizationId: ORGANIZATION_ID,
          action: 'organization.membership_role_changed',
          targetId: MEMBER_MEMBERSHIP_ID,
        },
        orderBy: { occurredAt: 'desc' },
      }),
    ).resolves.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          actorUserId: OWNER_ID,
          metadata: { previousRole: 'member', role: 'admin' },
        }),
      ]),
    )
    await expect(
      prisma.auditEvent.count({
        where: {
          organizationId: ORGANIZATION_ID,
          action: 'organization.membership_role_changed',
          targetId: MEMBER_MEMBERSHIP_ID,
        },
      }),
    ).resolves.toBe(auditCountBefore + 1)
  })

  it('rejects stale actor permission after persisted role changes', async () => {
    await prisma.membership.update({
      where: { id: ADMIN_MEMBERSHIP_ID },
      data: { role: 'member' },
    })

    await expect(
      changeRole.execute({
        organizationId: ORGANIZATION_ID,
        actorUserId: ADMIN_ID,
        membershipId: MEMBER_MEMBERSHIP_ID,
        role: 'admin',
      }),
    ).rejects.toThrow(OrganizationAccessDeniedError)
    await expect(
      prisma.membership.findUniqueOrThrow({ where: { id: MEMBER_MEMBERSHIP_ID } }),
    ).resolves.toMatchObject({ role: 'member' })
  })

  it('protects owner role changes', async () => {
    await expect(
      changeRole.execute({
        organizationId: ORGANIZATION_ID,
        actorUserId: OWNER_ID,
        membershipId: SECOND_OWNER_MEMBERSHIP_ID,
        role: 'admin',
      }),
    ).rejects.toThrow(OwnerMembershipProtectedError)
  })

  it('removes a non-owner membership and revokes access immediately', async () => {
    const auditCountBefore = await prisma.auditEvent.count({
      where: {
        organizationId: ORGANIZATION_ID,
        action: 'organization.membership_removed',
        targetId: MEMBER_MEMBERSHIP_ID,
      },
    })
    await removeMembership.execute({
      organizationId: ORGANIZATION_ID,
      actorUserId: ADMIN_ID,
      membershipId: MEMBER_MEMBERSHIP_ID,
    })

    await expect(
      accessRepository.findMembershipForAuthorization(ORGANIZATION_ID, MEMBER_ID),
    ).resolves.toEqual({ role: 'member', isActive: false })
    const page = await accessRepository.listActiveMemberships({
      organizationId: ORGANIZATION_ID,
      limit: 20,
    })
    expect(page.memberships.map(({ id }) => id)).not.toContain(MEMBER_MEMBERSHIP_ID)
    await expect(
      prisma.auditEvent.count({
        where: {
          organizationId: ORGANIZATION_ID,
          action: 'organization.membership_removed',
          targetId: MEMBER_MEMBERSHIP_ID,
        },
      }),
    ).resolves.toBe(auditCountBefore + 1)
  })

  it('allows an owner to remove another owner while one remains', async () => {
    await removeMembership.execute({
      organizationId: ORGANIZATION_ID,
      actorUserId: OWNER_ID,
      membershipId: SECOND_OWNER_MEMBERSHIP_ID,
    })

    await expect(
      prisma.membership.findUniqueOrThrow({ where: { id: SECOND_OWNER_MEMBERSHIP_ID } }),
    ).resolves.toMatchObject({ isActive: false })
    await expect(
      prisma.membership.count({
        where: { organizationId: ORGANIZATION_ID, role: 'owner', isActive: true },
      }),
    ).resolves.toBe(1)
  })

  it('rejects removal of the last active owner', async () => {
    await prisma.membership.update({
      where: { id: SECOND_OWNER_MEMBERSHIP_ID },
      data: { isActive: false },
    })
    const auditCountBefore = await prisma.auditEvent.count({
      where: {
        organizationId: ORGANIZATION_ID,
        action: 'organization.membership_removed',
        targetId: OWNER_MEMBERSHIP_ID,
      },
    })

    await expect(
      removeMembership.execute({
        organizationId: ORGANIZATION_ID,
        actorUserId: OWNER_ID,
        membershipId: OWNER_MEMBERSHIP_ID,
      }),
    ).rejects.toThrow(LastOwnerRequiredError)
    await expect(
      prisma.membership.findUniqueOrThrow({ where: { id: OWNER_MEMBERSHIP_ID } }),
    ).resolves.toMatchObject({ isActive: true })
    await expect(
      prisma.auditEvent.count({
        where: {
          organizationId: ORGANIZATION_ID,
          action: 'organization.membership_removed',
          targetId: OWNER_MEMBERSHIP_ID,
        },
      }),
    ).resolves.toBe(auditCountBefore)
  })

  it('preserves an active owner under concurrent cross-removal attempts', async () => {
    const results = await Promise.allSettled([
      removeMembership.execute({
        organizationId: ORGANIZATION_ID,
        actorUserId: OWNER_ID,
        membershipId: SECOND_OWNER_MEMBERSHIP_ID,
      }),
      removeMembership.execute({
        organizationId: ORGANIZATION_ID,
        actorUserId: SECOND_OWNER_ID,
        membershipId: OWNER_MEMBERSHIP_ID,
      }),
    ])

    expect(results.filter(({ status }) => status === 'fulfilled')).toHaveLength(1)
    await expect(
      prisma.membership.count({
        where: { organizationId: ORGANIZATION_ID, role: 'owner', isActive: true },
      }),
    ).resolves.toBe(1)
  })

  it('forbids admins from removing owners and conceals cross-tenant targets', async () => {
    await expect(
      removeMembership.execute({
        organizationId: ORGANIZATION_ID,
        actorUserId: ADMIN_ID,
        membershipId: OWNER_MEMBERSHIP_ID,
      }),
    ).rejects.toThrow(OrganizationAccessDeniedError)
    await expect(
      removeMembership.execute({
        organizationId: ORGANIZATION_ID,
        actorUserId: OWNER_ID,
        membershipId: OTHER_MEMBERSHIP_ID,
      }),
    ).rejects.toThrow(OrganizationMembershipNotFoundError)
  })

  function organization(id: string, name: string): Prisma.OrganizationCreateManyInput {
    return { id, name, isActive: true, createdAt: NOW, updatedAt: NOW }
  }

  function membership(
    id: string,
    organizationId: string,
    userId: string,
    role: 'owner' | 'admin' | 'member',
  ): Prisma.MembershipCreateManyInput {
    return {
      id,
      organizationId,
      userId,
      role,
      isActive: true,
      createdAt: NOW,
      updatedAt: NOW,
    }
  }
})
