import type { Clock } from '../../../shared/application/ports/clock'
import type { IdentifierGenerator } from '../../../shared/application/ports/identifier-generator'
import { LastOwnerRequiredError } from '../errors/last-owner-required.error'
import { OrganizationAccessDeniedError } from '../errors/organization-access-denied.error'
import { OrganizationMembershipNotFoundError } from '../errors/organization-membership-not-found.error'
import type { MembershipAdministrationRepository } from '../ports/membership-administration.repository'

export interface RemoveOrganizationMembershipInput {
  readonly organizationId: string
  readonly actorUserId: string
  readonly membershipId: string
}

export class RemoveOrganizationMembership {
  constructor(
    private readonly repository: MembershipAdministrationRepository,
    private readonly clock: Clock,
    private readonly identifiers: IdentifierGenerator,
  ) {}

  async execute(input: RemoveOrganizationMembershipInput): Promise<void> {
    const result = await this.repository.remove({
      ...input,
      currentTime: this.clock.now(),
      audit: { eventId: this.identifiers.generate() },
    })

    switch (result.outcome) {
      case 'removed':
        return
      case 'forbidden':
        throw new OrganizationAccessDeniedError()
      case 'not_found':
        throw new OrganizationMembershipNotFoundError()
      case 'last_owner':
        throw new LastOwnerRequiredError()
    }
  }
}
