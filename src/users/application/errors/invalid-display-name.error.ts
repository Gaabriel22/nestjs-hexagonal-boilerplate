import { ApplicationError } from '../../../shared/application/errors/application.error'

export class InvalidDisplayNameError extends ApplicationError {
  constructor() {
    super(
      'bad_request',
      'users.invalid_display_name',
      'Display name must contain 2 to 100 characters',
    )
  }
}
