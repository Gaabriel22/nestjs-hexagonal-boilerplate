import { ApplicationError } from '../../../shared/application/errors/application.error'

export class OwnerMembershipProtectedError extends ApplicationError {
  constructor() {
    super(
      'conflict',
      'organization.owner_membership_protected',
      'Owner role cannot be changed through membership role administration',
    )
  }
}
