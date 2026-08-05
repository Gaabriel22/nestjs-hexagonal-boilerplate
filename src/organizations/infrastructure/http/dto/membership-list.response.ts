import type {
  ActiveOrganizationMembershipPage,
  ActiveOrganizationMembershipView,
} from '../../../application/ports/organization-access.repository'
import type { MembershipRole } from '../../../domain/entities/organization-membership'

export class OrganizationMembershipResponse {
  readonly id: string
  readonly userId: string
  readonly role: MembershipRole
  readonly createdAt: string
  readonly updatedAt: string

  constructor(membership: ActiveOrganizationMembershipView) {
    this.id = membership.id
    this.userId = membership.userId
    this.role = membership.role
    this.createdAt = membership.createdAt.toISOString()
    this.updatedAt = membership.updatedAt.toISOString()
  }
}

export class MembershipListResponse {
  readonly memberships: OrganizationMembershipResponse[]
  readonly nextCursor: string | null

  constructor(page: ActiveOrganizationMembershipPage) {
    this.memberships = page.memberships.map(
      (membership) => new OrganizationMembershipResponse(membership),
    )
    this.nextCursor = page.nextCursor
  }
}
