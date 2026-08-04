import { DomainError } from '../../../shared/domain/errors/domain.error'

export class InvalidCredentialError extends DomainError {
  constructor() {
    super('identity.invalid_credential', 'Credential hash is invalid')
  }
}
