import { DomainError } from '../../../shared/domain/errors/domain.error'

export class InvalidOrganizationNameError extends DomainError {
  constructor() {
    super('organizations.invalid_name', 'Organization name must contain 2 to 120 characters')
  }
}
