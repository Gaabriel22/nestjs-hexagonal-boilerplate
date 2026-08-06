import { IsUUID } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class MembershipIdParams {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  organizationId!: string

  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  membershipId!: string
}
