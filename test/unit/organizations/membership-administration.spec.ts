import { LastOwnerRequiredError } from '../../../src/organizations/application/errors/last-owner-required.error'
import { OrganizationAccessDeniedError } from '../../../src/organizations/application/errors/organization-access-denied.error'
import { OrganizationMembershipNotFoundError } from '../../../src/organizations/application/errors/organization-membership-not-found.error'
import { OwnerMembershipProtectedError } from '../../../src/organizations/application/errors/owner-membership-protected.error'
import type { MembershipAdministrationRepository } from '../../../src/organizations/application/ports/membership-administration.repository'
import { ChangeOrganizationMembershipRole } from '../../../src/organizations/application/use-cases/change-organization-membership-role'
import { RemoveOrganizationMembership } from '../../../src/organizations/application/use-cases/remove-organization-membership'

const USER_ID = '00000000-0000-4000-8000-000000001501'
const ORGANIZATION_ID = '00000000-0000-4000-8000-000000001502'
const MEMBERSHIP_ID = '00000000-0000-4000-8000-000000001503'
const AUDIT_EVENT_ID = '00000000-0000-4000-8000-000000001504'
const NOW = new Date('2026-01-01T10:00:00.000Z')

describe('ChangeOrganizationMembershipRole', () => {
  it('changes a supported non-owner role with actor and tenant scope', async () => {
    const repository = createRepository()
    repository.changeRole.mockResolvedValue({
      outcome: 'changed',
      membership: {
        id: MEMBERSHIP_ID,
        organizationId: ORGANIZATION_ID,
        userId: USER_ID,
        role: 'admin',
        createdAt: NOW,
        updatedAt: NOW,
      },
    })
    const useCase = new ChangeOrganizationMembershipRole(
      repository,
      { now: (): Date => NOW },
      { generate: (): string => AUDIT_EVENT_ID },
    )

    const result = await useCase.execute({
      organizationId: ORGANIZATION_ID,
      actorUserId: USER_ID,
      membershipId: MEMBERSHIP_ID,
      role: 'admin',
    })

    expect(repository.changeRole.mock.calls).toEqual([
      [
        {
          organizationId: ORGANIZATION_ID,
          actorUserId: USER_ID,
          membershipId: MEMBERSHIP_ID,
          role: 'admin',
          currentTime: NOW,
          audit: { eventId: AUDIT_EVENT_ID, requestIdentifier: null },
        },
      ],
    ])
    expect(result.role).toBe('admin')
  })

  it.each([
    ['forbidden', OrganizationAccessDeniedError],
    ['not_found', OrganizationMembershipNotFoundError],
    ['owner_protected', OwnerMembershipProtectedError],
  ] as const)('maps %s outcome to stable error', async (outcome, errorType) => {
    const repository = createRepository()
    repository.changeRole.mockResolvedValue({ outcome })
    const useCase = new ChangeOrganizationMembershipRole(
      repository,
      { now: (): Date => NOW },
      { generate: (): string => AUDIT_EVENT_ID },
    )

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        actorUserId: USER_ID,
        membershipId: MEMBERSHIP_ID,
        role: 'member',
      }),
    ).rejects.toThrow(errorType)
  })
})

describe('RemoveOrganizationMembership', () => {
  it('removes membership with current actor, tenant, and time', async () => {
    const repository = createRepository()
    repository.remove.mockResolvedValue({ outcome: 'removed' })
    const useCase = new RemoveOrganizationMembership(
      repository,
      { now: (): Date => NOW },
      { generate: (): string => AUDIT_EVENT_ID },
    )

    await useCase.execute({
      organizationId: ORGANIZATION_ID,
      actorUserId: USER_ID,
      membershipId: MEMBERSHIP_ID,
    })

    expect(repository.remove.mock.calls).toEqual([
      [
        {
          organizationId: ORGANIZATION_ID,
          actorUserId: USER_ID,
          membershipId: MEMBERSHIP_ID,
          currentTime: NOW,
          audit: { eventId: AUDIT_EVENT_ID, requestIdentifier: null },
        },
      ],
    ])
  })

  it.each([
    ['forbidden', OrganizationAccessDeniedError],
    ['not_found', OrganizationMembershipNotFoundError],
    ['last_owner', LastOwnerRequiredError],
  ] as const)('maps %s outcome to stable error', async (outcome, errorType) => {
    const repository = createRepository()
    repository.remove.mockResolvedValue({ outcome })
    const useCase = new RemoveOrganizationMembership(
      repository,
      { now: (): Date => NOW },
      { generate: (): string => AUDIT_EVENT_ID },
    )

    await expect(
      useCase.execute({
        organizationId: ORGANIZATION_ID,
        actorUserId: USER_ID,
        membershipId: MEMBERSHIP_ID,
      }),
    ).rejects.toThrow(errorType)
  })
})

function createRepository(): jest.Mocked<MembershipAdministrationRepository> {
  return {
    changeRole: jest.fn(),
    remove: jest.fn(),
  }
}
