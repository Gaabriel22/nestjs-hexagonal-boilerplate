import { Type } from 'class-transformer'
import { IsIn, IsInt, IsISO8601, IsOptional, IsUUID, Max, Min } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'

import {
  AUDIT_ACTIONS,
  AUDIT_TARGET_TYPES,
  type AuditAction,
  type AuditTargetType,
} from '../../../domain/audit-event'

export class AuditEventListQuery {
  @ApiPropertyOptional({ format: 'uuid', description: 'Last event ID from the previous page' })
  @IsOptional()
  @IsUUID('4')
  cursor?: string

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20

  @ApiPropertyOptional({ enum: AUDIT_ACTIONS })
  @IsOptional()
  @IsIn(AUDIT_ACTIONS)
  action?: AuditAction

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  actorUserId?: string

  @ApiPropertyOptional({ enum: AUDIT_TARGET_TYPES })
  @IsOptional()
  @IsIn(AUDIT_TARGET_TYPES)
  targetType?: AuditTargetType

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  targetId?: string

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601({ strict: true })
  occurredFrom?: string

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsISO8601({ strict: true })
  occurredTo?: string
}
