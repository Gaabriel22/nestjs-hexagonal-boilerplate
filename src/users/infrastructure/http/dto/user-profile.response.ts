import type { UserProfile } from '../../../application/ports/user-profile.repository'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class UserProfileResponse {
  @ApiProperty({ format: 'uuid' })
  readonly id: string

  @ApiProperty({ format: 'email', example: 'developer@example.com' })
  readonly email: string

  @ApiPropertyOptional({ nullable: true, example: 'Ada Lovelace' })
  readonly displayName: string | null

  @ApiProperty({ example: true })
  readonly isActive: boolean

  @ApiProperty({ format: 'date-time' })
  readonly createdAt: string

  @ApiProperty({ format: 'date-time' })
  readonly updatedAt: string

  constructor(profile: UserProfile) {
    this.id = profile.id
    this.email = profile.email
    this.displayName = profile.displayName
    this.isActive = profile.isActive
    this.createdAt = profile.createdAt.toISOString()
    this.updatedAt = profile.updatedAt.toISOString()
  }
}
