import type {
  AuditEventView,
  OrganizationAuditEventPage,
} from '../../../application/ports/audit-query.port'
import type { SafeAuditMetadata } from '../../../domain/audit-event'

export class AuditEventResponse {
  readonly id: string
  readonly actorUserId: string
  readonly organizationId: string
  readonly action: string
  readonly targetType: string
  readonly targetId: string
  readonly requestIdentifier: string | null
  readonly metadata: SafeAuditMetadata
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
  readonly events: AuditEventResponse[]
  readonly nextCursor: string | null

  constructor(page: OrganizationAuditEventPage) {
    this.events = page.events.map((event) => new AuditEventResponse(event))
    this.nextCursor = page.nextCursor
  }
}
