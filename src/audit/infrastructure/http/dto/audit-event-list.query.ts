import { Type } from 'class-transformer'
import { IsIn, IsInt, IsISO8601, IsOptional, IsUUID, Max, Min } from 'class-validator'

import {
  AUDIT_ACTIONS,
  AUDIT_TARGET_TYPES,
  type AuditAction,
  type AuditTargetType,
} from '../../../domain/audit-event'

export class AuditEventListQuery {
  @IsOptional()
  @IsUUID('4')
  cursor?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20

  @IsOptional()
  @IsIn(AUDIT_ACTIONS)
  action?: AuditAction

  @IsOptional()
  @IsUUID('4')
  actorUserId?: string

  @IsOptional()
  @IsIn(AUDIT_TARGET_TYPES)
  targetType?: AuditTargetType

  @IsOptional()
  @IsUUID('4')
  targetId?: string

  @IsOptional()
  @IsISO8601({ strict: true })
  occurredFrom?: string

  @IsOptional()
  @IsISO8601({ strict: true })
  occurredTo?: string
}
