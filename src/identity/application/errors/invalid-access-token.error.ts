import { ApplicationError } from '../../../shared/application/errors/application.error'

export class InvalidAccessTokenError extends ApplicationError {
  constructor() {
    super('unauthorized', 'identity.invalid_access_token', 'Access token is invalid or expired')
  }
}
