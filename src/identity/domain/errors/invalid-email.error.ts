import { DomainError } from '../../../shared/domain/errors/domain.error'

export class InvalidEmailError extends DomainError {
  constructor() {
    super('identity.invalid_email', 'Email address is invalid')
  }
}
