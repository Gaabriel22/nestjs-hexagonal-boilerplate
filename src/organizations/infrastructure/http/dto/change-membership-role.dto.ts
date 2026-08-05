import { IsIn, IsString } from 'class-validator'

import type { AssignableMembershipRole } from '../../../application/ports/membership-administration.repository'

export class ChangeMembershipRoleDto {
  @IsString()
  @IsIn(['admin', 'member'])
  role!: AssignableMembershipRole
}
