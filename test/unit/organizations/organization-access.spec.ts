import type { ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Test } from '@nestjs/testing'

import { OrganizationAccessDeniedError } from '../../../src/organizations/application/errors/organization-access-denied.error'
import {
  ORGANIZATION_ACCESS_REPOSITORY,
  type OrganizationAccessRepository,
} from '../../../src/organizations/application/ports/organization-access.repository'
import {
  ORGANIZATION_PERMISSIONS,
  hasOrganizationPermission,
  permissionsForRole,
  type OrganizationPermission,
} from '../../../src/organizations/application/policies/organization-permission.policy'
import { ListOrganizationMemberships } from '../../../src/organizations/application/use-cases/list-organization-memberships'
import type { MembershipRole } from '../../../src/organizations/domain/entities/organization-membership'
import { OrganizationPermissionGuard } from '../../../src/organizations/infrastructure/http/organization-permission.guard'

const USER_ID = '00000000-0000-4000-8000-000000001301'
const ORGANIZATION_ID = '00000000-0000-4000-8000-000000001302'
const MEMBERSHIP_ID = '00000000-0000-4000-8000-000000001303'
const NOW = new Date('2026-01-01T10:00:00.000Z')

const EXPECTED_PERMISSIONS: Readonly<Record<MembershipRole, readonly OrganizationPermission[]>> = {
  owner: ORGANIZATION_PERMISSIONS,
  admin: [
    'organization:read',
    'organization:update',
    'membership:read',
    'membership:manage',
    'membership:remove',
    'audit:read',
  ],
  member: ['organization:read', 'membership:read'],
}

describe('organization permission policy', () => {
  it.each(['owner', 'admin', 'member'] as const)('maps every %s permission explicitly', (role) => {
    expect(permissionsForRole(role)).toEqual(EXPECTED_PERMISSIONS[role])

    for (const permission of ORGANIZATION_PERMISSIONS) {
      expect(hasOrganizationPermission({ role, isActive: true }, permission)).toBe(
        EXPECTED_PERMISSIONS[role].includes(permission),
      )
    }
  })

  it.each(['owner', 'admin', 'member'] as const)(
    'denies every permission for inactive %s membership',
    (role) => {
      for (const permission of ORGANIZATION_PERMISSIONS) {
        expect(hasOrganizationPermission({ role, isActive: false }, permission)).toBe(false)
      }
    },
  )
})

describe('OrganizationPermissionGuard', () => {
  let repository: jest.Mocked<OrganizationAccessRepository>
  let reflector: jest.Mocked<Pick<Reflector, 'getAllAndOverride'>>
  let guard: OrganizationPermissionGuard

  beforeEach(async () => {
    repository = createRepository()
    reflector = { getAllAndOverride: jest.fn().mockReturnValue('membership:read') }
    const module = await Test.createTestingModule({
      providers: [
        OrganizationPermissionGuard,
        { provide: Reflector, useValue: reflector },
        { provide: ORGANIZATION_ACCESS_REPOSITORY, useValue: repository },
      ],
    }).compile()

    guard = module.get(OrganizationPermissionGuard)
  })

  it('loads current persisted membership for requested organization', async () => {
    repository.findMembershipForAuthorization.mockResolvedValue({ role: 'member', isActive: true })

    await expect(guard.canActivate(createContext())).resolves.toBe(true)
    expect(repository.findMembershipForAuthorization.mock.calls).toEqual([
      [ORGANIZATION_ID, USER_ID],
    ])
  })

  it.each([
    ['missing membership', null],
    ['inactive membership', { role: 'owner' as const, isActive: false }],
  ])('denies %s', async (_case, membership) => {
    repository.findMembershipForAuthorization.mockResolvedValue(membership)

    await expect(guard.canActivate(createContext())).rejects.toThrow(OrganizationAccessDeniedError)
  })
})

describe('ListOrganizationMemberships', () => {
  it('delegates pagination with mandatory tenant scope', async () => {
    const repository = createRepository()
    repository.listActiveMemberships.mockResolvedValue({
      memberships: [
        {
          id: MEMBERSHIP_ID,
          organizationId: ORGANIZATION_ID,
          userId: USER_ID,
          role: 'owner',
          createdAt: NOW,
          updatedAt: NOW,
        },
      ],
      nextCursor: MEMBERSHIP_ID,
    })

    const result = await new ListOrganizationMemberships(repository).execute({
      organizationId: ORGANIZATION_ID,
      cursor: MEMBERSHIP_ID,
      limit: 25,
    })

    expect(repository.listActiveMemberships.mock.calls).toEqual([
      [{ organizationId: ORGANIZATION_ID, cursor: MEMBERSHIP_ID, limit: 25 }],
    ])
    expect(result.nextCursor).toBe(MEMBERSHIP_ID)
  })
})

function createRepository(): jest.Mocked<OrganizationAccessRepository> {
  return {
    findMembershipForAuthorization: jest.fn(),
    listActiveMemberships: jest.fn(),
  }
}

function createContext(): ExecutionContext {
  const request = {
    params: { organizationId: ORGANIZATION_ID },
    identity: { userId: USER_ID, sessionId: 'session-id' },
  }

  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => createContext,
    getClass: () => OrganizationPermissionGuard,
  } as unknown as ExecutionContext
}
