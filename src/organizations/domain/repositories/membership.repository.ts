import type { OrganizationMembership } from '../entities/organization-membership'

export const MEMBERSHIP_REPOSITORY = Symbol('MEMBERSHIP_REPOSITORY')

export interface MembershipRepository {
  save(membership: OrganizationMembership): Promise<void>
  findByIdForOrganization(
    id: string,
    organizationId: string,
  ): Promise<OrganizationMembership | null>
}
