import type { RegisteredUserResult } from '../../../application/use-cases/register-user'

export class RegisteredUserResponse {
  readonly id: string
  readonly email: string
  readonly isActive: boolean
  readonly createdAt: Date

  constructor(result: RegisteredUserResult) {
    this.id = result.id
    this.email = result.email
    this.isActive = result.isActive
    this.createdAt = result.createdAt
  }
}
