import { IsIn, IsString } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

import type { AssignableMembershipRole } from '../../../application/ports/membership-administration.repository'

export class ChangeMembershipRoleDto {
  @ApiProperty({ enum: ['admin', 'member'], example: 'admin' })
  @IsString()
  @IsIn(['admin', 'member'])
  role!: AssignableMembershipRole
}
