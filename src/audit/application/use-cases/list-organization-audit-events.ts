import type {
  AuditQueryPort,
  ListOrganizationAuditEventsInput,
  OrganizationAuditEventPage,
} from '../ports/audit-query.port'

export class ListOrganizationAuditEvents {
  constructor(private readonly auditQueries: AuditQueryPort) {}

  execute(input: ListOrganizationAuditEventsInput): Promise<OrganizationAuditEventPage> {
    return this.auditQueries.listOrganizationEvents(input)
  }
}
