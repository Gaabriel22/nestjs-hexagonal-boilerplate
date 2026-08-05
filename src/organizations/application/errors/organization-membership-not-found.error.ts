import { ApplicationError } from '../../../shared/application/errors/application.error'

export class OrganizationMembershipNotFoundError extends ApplicationError {
  constructor() {
    super('not_found', 'organization.membership_not_found', 'Organization membership was not found')
  }
}
