import type { Organization } from '../entities/organization'

export const ORGANIZATION_REPOSITORY = Symbol('ORGANIZATION_REPOSITORY')

export interface OrganizationRepository {
  save(organization: Organization): Promise<void>
  findById(id: string): Promise<Organization | null>
}
