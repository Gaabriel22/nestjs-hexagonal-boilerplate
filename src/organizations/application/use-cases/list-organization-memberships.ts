import type {
  ActiveOrganizationMembershipPage,
  OrganizationAccessRepository,
} from '../ports/organization-access.repository'

export interface ListOrganizationMembershipsInput {
  readonly organizationId: string
  readonly cursor?: string
  readonly limit: number
}

export class ListOrganizationMemberships {
  constructor(private readonly repository: OrganizationAccessRepository) {}

  execute(input: ListOrganizationMembershipsInput): Promise<ActiveOrganizationMembershipPage> {
    return this.repository.listActiveMemberships(input)
  }
}
