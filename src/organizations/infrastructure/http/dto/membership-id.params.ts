import { IsUUID } from 'class-validator'

export class MembershipIdParams {
  @IsUUID('4')
  organizationId!: string

  @IsUUID('4')
  membershipId!: string
}
