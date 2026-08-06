import type { RegisteredUserResult } from '../../../application/use-cases/register-user'
import { ApiProperty } from '@nestjs/swagger'

export class RegisteredUserResponse {
  @ApiProperty({ format: 'uuid' })
  readonly id: string

  @ApiProperty({ format: 'email', example: 'developer@example.com' })
  readonly email: string

  @ApiProperty({ example: true })
  readonly isActive: boolean

  @ApiProperty({ type: String, format: 'date-time' })
  readonly createdAt: Date

  constructor(result: RegisteredUserResult) {
    this.id = result.id
    this.email = result.email
    this.isActive = result.isActive
    this.createdAt = result.createdAt
  }
}
