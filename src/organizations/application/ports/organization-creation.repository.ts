import type { Organization } from '../../domain/entities/organization'
import type { OrganizationMembership } from '../../domain/entities/organization-membership'

export const ORGANIZATION_CREATION_REPOSITORY = Symbol('ORGANIZATION_CREATION_REPOSITORY')

export interface OrganizationCreationRepository {
  createWithOwner(
    organization: Organization,
    ownerMembership: OrganizationMembership,
  ): Promise<void>
}
