import type { TestingModule } from '@nestjs/testing'
import { Test } from '@nestjs/testing'

import {
  ORGANIZATION_CREATION_REPOSITORY,
  type OrganizationCreationRepository,
} from '../../../src/organizations/application/ports/organization-creation.repository'
import { CreateOrganization } from '../../../src/organizations/application/use-cases/create-organization'
import { Organization } from '../../../src/organizations/domain/entities/organization'
import { OrganizationMembership } from '../../../src/organizations/domain/entities/organization-membership'
import {
  MEMBERSHIP_REPOSITORY,
  type MembershipRepository,
} from '../../../src/organizations/domain/repositories/membership.repository'
import {
  ORGANIZATION_REPOSITORY,
  type OrganizationRepository,
} from '../../../src/organizations/domain/repositories/organization.repository'
import { OrganizationsModule } from '../../../src/organizations/organizations.module'
import { ConfigurationModule } from '../../../src/shared/infrastructure/config/configuration.module'
import { DatabaseModule } from '../../../src/shared/infrastructure/database/database.module'
import { PrismaService } from '../../../src/shared/infrastructure/database/prisma.service'

const USER_ID = '00000000-0000-4000-8000-000000001101'
const ORGANIZATION_ID = '00000000-0000-4000-8000-000000001102'
const MEMBERSHIP_ID = '00000000-0000-4000-8000-000000001103'
const ROLLBACK_ORGANIZATION_ID = '00000000-0000-4000-8000-000000001104'
const NOW = new Date('2026-01-01T10:00:00.000Z')

describe('organization creation persistence', () => {
  let module: TestingModule
  let prisma: PrismaService
  let organizations: OrganizationRepository
  let memberships: MembershipRepository
  let creationRepository: OrganizationCreationRepository
  let createOrganization: CreateOrganization

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ConfigurationModule, DatabaseModule, OrganizationsModule],
    }).compile()
    await module.init()

    prisma = module.get(PrismaService)
    organizations = module.get(ORGANIZATION_REPOSITORY)
    memberships = module.get(MEMBERSHIP_REPOSITORY)
    creationRepository = module.get(ORGANIZATION_CREATION_REPOSITORY)
    createOrganization = module.get(CreateOrganization)
  })

  beforeEach(async () => {
    await prisma.membership.deleteMany()
    await prisma.organization.deleteMany()
    await prisma.user.deleteMany()
    await prisma.user.create({
      data: {
        id: USER_ID,
        normalizedEmail: 'organization-owner@example.com',
        isActive: true,
        createdAt: NOW,
        updatedAt: NOW,
      },
    })
  })

  afterAll(async () => {
    await module.close()
  })

  it('maps organizations and memberships while enforcing tenant ownership uniqueness', async () => {
    const organization = restoreOrganization(ORGANIZATION_ID, 'Example Company')
    const membership = restoreOwner(MEMBERSHIP_ID, ORGANIZATION_ID)

    await organizations.save(organization)
    await memberships.save(membership)

    await expect(organizations.findById(ORGANIZATION_ID)).resolves.toMatchObject({
      id: ORGANIZATION_ID,
      name: 'Example Company',
      isActive: true,
    })
    await expect(
      memberships.findByIdForOrganization(MEMBERSHIP_ID, ORGANIZATION_ID),
    ).resolves.toMatchObject({
      id: MEMBERSHIP_ID,
      organizationId: ORGANIZATION_ID,
      userId: USER_ID,
      role: 'owner',
      isActive: true,
    })
    await expect(
      memberships.findByIdForOrganization(MEMBERSHIP_ID, ROLLBACK_ORGANIZATION_ID),
    ).resolves.toBeNull()
    await expect(
      prisma.membership.create({
        data: {
          id: '00000000-0000-4000-8000-000000001105',
          organizationId: ORGANIZATION_ID,
          userId: USER_ID,
          role: 'member',
          isActive: true,
          createdAt: NOW,
          updatedAt: NOW,
        },
      }),
    ).rejects.toThrow()
  })

  it('creates the organization and active owner in one use case', async () => {
    const result = await createOrganization.execute({
      actorUserId: USER_ID,
      name: '  Atomic   Company  ',
    })
    const membership = await prisma.membership.findUniqueOrThrow({
      where: {
        organizationId_userId: {
          organizationId: result.id,
          userId: USER_ID,
        },
      },
    })

    expect(result).toMatchObject({
      name: 'Atomic Company',
      isActive: true,
      ownerMembership: { userId: USER_ID, role: 'owner', isActive: true },
    })
    expect(membership).toMatchObject({
      organizationId: result.id,
      userId: USER_ID,
      role: 'owner',
      isActive: true,
    })
  })

  it('rolls organization creation back when owner membership persistence fails', async () => {
    await creationRepository.createWithOwner(
      restoreOrganization(ORGANIZATION_ID, 'Existing Company'),
      restoreOwner(MEMBERSHIP_ID, ORGANIZATION_ID),
    )

    await expect(
      creationRepository.createWithOwner(
        restoreOrganization(ROLLBACK_ORGANIZATION_ID, 'Rolled Back Company'),
        restoreOwner(MEMBERSHIP_ID, ROLLBACK_ORGANIZATION_ID),
      ),
    ).rejects.toThrow()

    await expect(
      prisma.organization.findUnique({ where: { id: ROLLBACK_ORGANIZATION_ID } }),
    ).resolves.toBeNull()
    await expect(prisma.organization.count()).resolves.toBe(1)
    await expect(prisma.membership.count()).resolves.toBe(1)
  })

  function restoreOrganization(id: string, name: string): Organization {
    return Organization.restore({
      id,
      name,
      isActive: true,
      createdAt: NOW,
      updatedAt: NOW,
    })
  }

  function restoreOwner(id: string, organizationId: string): OrganizationMembership {
    return OrganizationMembership.restore({
      id,
      organizationId,
      userId: USER_ID,
      role: 'owner',
      isActive: true,
      createdAt: NOW,
      updatedAt: NOW,
    })
  }
})
