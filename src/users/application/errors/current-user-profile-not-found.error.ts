import { ApplicationError } from '../../../shared/application/errors/application.error'

export class CurrentUserProfileNotFoundError extends ApplicationError {
  constructor() {
    super('not_found', 'users.current_profile_not_found', 'Current user profile was not found')
  }
}
