import { DomainError } from '../../../shared/domain/errors/domain.error'

export class WeakPasswordError extends DomainError {
  constructor() {
    super('identity.weak_password', 'Password must contain between 12 and 128 characters')
  }
}
