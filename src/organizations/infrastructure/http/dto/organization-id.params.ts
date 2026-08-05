import { IsUUID } from 'class-validator'

export class OrganizationIdParams {
  @IsUUID('4')
  organizationId!: string
}
