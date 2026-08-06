import type {
  AuditEventView,
  OrganizationAuditEventPage,
} from '../../../application/ports/audit-query.port'
import type { SafeAuditMetadata } from '../../../domain/audit-event'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

import { AUDIT_ACTIONS, AUDIT_TARGET_TYPES } from '../../../domain/audit-event'

export class AuditEventResponse {
  @ApiProperty({ format: 'uuid' })
  readonly id: string

  @ApiProperty({ format: 'uuid' })
  readonly actorUserId: string

  @ApiProperty({ format: 'uuid' })
  readonly organizationId: string

  @ApiProperty({ enum: AUDIT_ACTIONS })
  readonly action: string

  @ApiProperty({ enum: AUDIT_TARGET_TYPES })
  readonly targetType: string

  @ApiProperty({ format: 'uuid' })
  readonly targetId: string

  @ApiPropertyOptional({ nullable: true, example: 'req-1' })
  readonly requestIdentifier: string | null

  @ApiProperty({
    type: 'object',
    additionalProperties: {
      oneOf: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }, { type: 'null' }],
    },
    example: { previousRole: 'member', role: 'admin' },
  })
  readonly metadata: SafeAuditMetadata

  @ApiProperty({ format: 'date-time' })
  readonly occurredAt: string

  constructor(event: AuditEventView) {
    this.id = event.id
    this.actorUserId = event.actorUserId
    this.organizationId = event.organizationId
    this.action = event.action
    this.targetType = event.targetType
    this.targetId = event.targetId
    this.requestIdentifier = event.requestIdentifier
    this.metadata = event.metadata
    this.occurredAt = event.occurredAt.toISOString()
  }
}

export class AuditEventListResponse {
  @ApiProperty({ type: () => [AuditEventResponse] })
  readonly events: AuditEventResponse[]

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  readonly nextCursor: string | null

  constructor(page: OrganizationAuditEventPage) {
    this.events = page.events.map((event) => new AuditEventResponse(event))
    this.nextCursor = page.nextCursor
  }
}
