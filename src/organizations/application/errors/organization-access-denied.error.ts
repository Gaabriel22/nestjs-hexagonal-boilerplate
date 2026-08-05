import { ApplicationError } from '../../../shared/application/errors/application.error'

export class OrganizationAccessDeniedError extends ApplicationError {
  constructor() {
    super(
      'forbidden',
      'organization.access_denied',
      'You do not have permission to access this organization resource',
    )
  }
}
