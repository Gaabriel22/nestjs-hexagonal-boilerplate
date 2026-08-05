import type { MembershipRole } from '../../domain/entities/organization-membership'

export const ORGANIZATION_ACCESS_REPOSITORY = Symbol('ORGANIZATION_ACCESS_REPOSITORY')

export interface OrganizationMembershipAuthorizationView {
  readonly role: MembershipRole
  readonly isActive: boolean
}

export interface ActiveOrganizationMembershipView {
  readonly id: string
  readonly organizationId: string
  readonly userId: string
  readonly role: MembershipRole
  readonly createdAt: Date
  readonly updatedAt: Date
}

export interface ListActiveOrganizationMembershipsInput {
  readonly organizationId: string
  readonly cursor?: string
  readonly limit: number
}

export interface ActiveOrganizationMembershipPage {
  readonly memberships: readonly ActiveOrganizationMembershipView[]
  readonly nextCursor: string | null
}

export interface OrganizationAccessRepository {
  findMembershipForAuthorization(
    organizationId: string,
    userId: string,
  ): Promise<OrganizationMembershipAuthorizationView | null>
  listActiveMemberships(
    input: ListActiveOrganizationMembershipsInput,
  ): Promise<ActiveOrganizationMembershipPage>
}
