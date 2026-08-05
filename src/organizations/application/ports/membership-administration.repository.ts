import type { AuditContext } from '../../../audit/application/audit-context'
import type { ActiveOrganizationMembershipView } from './organization-access.repository'

export const MEMBERSHIP_ADMINISTRATION_REPOSITORY = Symbol('MEMBERSHIP_ADMINISTRATION_REPOSITORY')

export type AssignableMembershipRole = 'admin' | 'member'

export interface ChangeMembershipRoleInput {
  readonly organizationId: string
  readonly actorUserId: string
  readonly membershipId: string
  readonly role: AssignableMembershipRole
  readonly currentTime: Date
  readonly audit: AuditContext
}

export type ChangeMembershipRoleResult =
  | { readonly outcome: 'changed'; readonly membership: ActiveOrganizationMembershipView }
  | { readonly outcome: 'forbidden' }
  | { readonly outcome: 'not_found' }
  | { readonly outcome: 'owner_protected' }

export interface RemoveMembershipInput {
  readonly organizationId: string
  readonly actorUserId: string
  readonly membershipId: string
  readonly currentTime: Date
  readonly audit: AuditContext
}

export type RemoveMembershipResult =
  | { readonly outcome: 'removed' }
  | { readonly outcome: 'forbidden' }
  | { readonly outcome: 'not_found' }
  | { readonly outcome: 'last_owner' }

export interface MembershipAdministrationRepository {
  changeRole(input: ChangeMembershipRoleInput): Promise<ChangeMembershipRoleResult>
  remove(input: RemoveMembershipInput): Promise<RemoveMembershipResult>
}
