import { ApplicationError } from '../../../shared/application/errors/application.error'

export class InvalidCredentialsError extends ApplicationError {
  constructor() {
    super('unauthorized', 'identity.invalid_credentials', 'Invalid email or password')
  }
}
