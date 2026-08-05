import type { TestingModule } from '@nestjs/testing'
import { Test } from '@nestjs/testing'

import type { Prisma } from '../../../src/generated/prisma/client'
import {
  ORGANIZATION_ACCESS_REPOSITORY,
  type OrganizationAccessRepository,
} from '../../../src/organizations/application/ports/organization-access.repository'
import { OrganizationsModule } from '../../../src/organizations/organizations.module'
import { ConfigurationModule } from '../../../src/shared/infrastructure/config/configuration.module'
import { DatabaseModule } from '../../../src/shared/infrastructure/database/database.module'
import { PrismaService } from '../../../src/shared/infrastructure/database/prisma.service'

const OWNER_ID = '00000000-0000-4000-8000-000000001311'
const MEMBER_ID = '00000000-0000-4000-8000-000000001312'
const INACTIVE_MEMBER_ID = '00000000-0000-4000-8000-000000001313'
const OTHER_OWNER_ID = '00000000-0000-4000-8000-000000001314'
const ORGANIZATION_ID = '00000000-0000-4000-8000-000000001321'
const OTHER_ORGANIZATION_ID = '00000000-0000-4000-8000-000000001322'
const OWNER_MEMBERSHIP_ID = '00000000-0000-4000-8000-000000001331'
const MEMBER_MEMBERSHIP_ID = '00000000-0000-4000-8000-000000001332'
const INACTIVE_MEMBERSHIP_ID = '00000000-0000-4000-8000-000000001333'
const OTHER_MEMBERSHIP_ID = '00000000-0000-4000-8000-000000001334'
const NOW = new Date('2026-01-01T10:00:00.000Z')

describe('organization access persistence', () => {
  let module: TestingModule
  let prisma: PrismaService
  let repository: OrganizationAccessRepository

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ConfigurationModule, DatabaseModule, OrganizationsModule],
    }).compile()
    await module.init()

    prisma = module.get(PrismaService)
    repository = module.get(ORGANIZATION_ACCESS_REPOSITORY)
  })

  beforeEach(async () => {
    await prisma.membership.deleteMany()
    await prisma.organization.deleteMany()
    await prisma.user.deleteMany()
    await prisma.user.createMany({
      data: [OWNER_ID, MEMBER_ID, INACTIVE_MEMBER_ID, OTHER_OWNER_ID].map((id, index) => ({
        id,
        normalizedEmail: `organization-access-${String(index)}@example.com`,
        isActive: true,
        createdAt: NOW,
        updatedAt: NOW,
      })),
    })
    await prisma.organization.createMany({
      data: [
        {
          id: ORGANIZATION_ID,
          name: 'Scoped Organization',
          isActive: true,
          createdAt: NOW,
          updatedAt: NOW,
        },
        {
          id: OTHER_ORGANIZATION_ID,
          name: 'Foreign Organization',
          isActive: true,
          createdAt: NOW,
          updatedAt: NOW,
        },
      ],
    })
    await prisma.membership.createMany({
      data: [
        membership(OWNER_MEMBERSHIP_ID, ORGANIZATION_ID, OWNER_ID, 'owner', true),
        membership(MEMBER_MEMBERSHIP_ID, ORGANIZATION_ID, MEMBER_ID, 'member', true),
        membership(INACTIVE_MEMBERSHIP_ID, ORGANIZATION_ID, INACTIVE_MEMBER_ID, 'admin', false),
        membership(OTHER_MEMBERSHIP_ID, OTHER_ORGANIZATION_ID, OTHER_OWNER_ID, 'owner', true),
      ],
    })
  })

  afterAll(async () => {
    await module.close()
  })

  it('loads current persisted role and active state through organization and user scope', async () => {
    await expect(
      repository.findMembershipForAuthorization(ORGANIZATION_ID, OWNER_ID),
    ).resolves.toEqual({ role: 'owner', isActive: true })
    await expect(
      repository.findMembershipForAuthorization(ORGANIZATION_ID, INACTIVE_MEMBER_ID),
    ).resolves.toEqual({ role: 'admin', isActive: false })
    await expect(
      repository.findMembershipForAuthorization(OTHER_ORGANIZATION_ID, OWNER_ID),
    ).resolves.toBeNull()
  })

  it('cursor-paginates only active memberships from requested organization', async () => {
    const firstPage = await repository.listActiveMemberships({
      organizationId: ORGANIZATION_ID,
      limit: 1,
    })
    const secondPage = await repository.listActiveMemberships({
      organizationId: ORGANIZATION_ID,
      cursor: firstPage.nextCursor ?? undefined,
      limit: 1,
    })

    expect(firstPage.memberships.map(({ id }) => id)).toEqual([OWNER_MEMBERSHIP_ID])
    expect(firstPage.nextCursor).toBe(OWNER_MEMBERSHIP_ID)
    expect(secondPage.memberships.map(({ id }) => id)).toEqual([MEMBER_MEMBERSHIP_ID])
    expect(secondPage.nextCursor).toBeNull()
    expect(
      [...firstPage.memberships, ...secondPage.memberships].every(
        (item) => item.organizationId === ORGANIZATION_ID,
      ),
    ).toBe(true)
  })

  function membership(
    id: string,
    organizationId: string,
    userId: string,
    role: 'owner' | 'admin' | 'member',
    isActive: boolean,
  ): Prisma.MembershipCreateManyInput {
    return {
      id,
      organizationId,
      userId,
      role,
      isActive,
      createdAt: NOW,
      updatedAt: NOW,
    }
  }
})
