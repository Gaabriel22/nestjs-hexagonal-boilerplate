import { ApplicationError } from '../../../shared/application/errors/application.error'

export class LastOwnerRequiredError extends ApplicationError {
  constructor() {
    super(
      'conflict',
      'organization.last_owner_required',
      'Organization must retain at least one active owner',
    )
  }
}
