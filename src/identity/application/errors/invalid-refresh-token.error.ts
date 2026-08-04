import { ApplicationError } from '../../../shared/application/errors/application.error'

export class InvalidRefreshTokenError extends ApplicationError {
  constructor() {
    super('unauthorized', 'identity.invalid_refresh_token', 'Refresh token is invalid or expired')
  }
}
