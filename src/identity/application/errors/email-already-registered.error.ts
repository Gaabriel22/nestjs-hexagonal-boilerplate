import { ApplicationError } from '../../../shared/application/errors/application.error'

export class EmailAlreadyRegisteredError extends ApplicationError {
  constructor() {
    super('conflict', 'identity.email_already_registered', 'Email address is already registered')
  }
}
