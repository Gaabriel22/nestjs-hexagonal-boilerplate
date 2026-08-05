import type { Clock } from '../../../shared/application/ports/clock'
import { OrganizationAccessDeniedError } from '../errors/organization-access-denied.error'
import { OrganizationMembershipNotFoundError } from '../errors/organization-membership-not-found.error'
import { OwnerMembershipProtectedError } from '../errors/owner-membership-protected.error'
import type {
  AssignableMembershipRole,
  MembershipAdministrationRepository,
} from '../ports/membership-administration.repository'
import type { ActiveOrganizationMembershipView } from '../ports/organization-access.repository'

export interface ChangeOrganizationMembershipRoleInput {
  readonly organizationId: string
  readonly actorUserId: string
  readonly membershipId: string
  readonly role: AssignableMembershipRole
}

export class ChangeOrganizationMembershipRole {
  constructor(
    private readonly repository: MembershipAdministrationRepository,
    private readonly clock: Clock,
  ) {}

  async execute(
    input: ChangeOrganizationMembershipRoleInput,
  ): Promise<ActiveOrganizationMembershipView> {
    const result = await this.repository.changeRole({ ...input, currentTime: this.clock.now() })

    switch (result.outcome) {
      case 'changed':
        return result.membership
      case 'forbidden':
        throw new OrganizationAccessDeniedError()
      case 'not_found':
        throw new OrganizationMembershipNotFoundError()
      case 'owner_protected':
        throw new OwnerMembershipProtectedError()
    }
  }
}
