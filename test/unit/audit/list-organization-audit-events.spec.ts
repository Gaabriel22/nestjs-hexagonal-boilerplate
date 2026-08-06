import type {
  AuditQueryPort,
  OrganizationAuditEventPage,
} from '../../../src/audit/application/ports/audit-query.port'
import { ListOrganizationAuditEvents } from '../../../src/audit/application/use-cases/list-organization-audit-events'

describe('ListOrganizationAuditEvents', () => {
  it('delegates tenant scope, cursor and filters to the query port', async () => {
    const page: OrganizationAuditEventPage = { events: [], nextCursor: null }
    const listOrganizationEvents = jest.fn().mockResolvedValue(page)
    const auditQueries: AuditQueryPort = {
      listOrganizationEvents,
    }
    const useCase = new ListOrganizationAuditEvents(auditQueries)
    const input = {
      organizationId: '00000000-0000-4000-8000-000000001701',
      cursor: '00000000-0000-4000-8000-000000001702',
      limit: 25,
      action: 'organization.membership_removed' as const,
      actorUserId: '00000000-0000-4000-8000-000000001703',
      targetType: 'membership' as const,
      targetId: '00000000-0000-4000-8000-000000001704',
      occurredFrom: new Date('2026-01-01T10:00:00.000Z'),
      occurredTo: new Date('2026-01-02T10:00:00.000Z'),
    }

    await expect(useCase.execute(input)).resolves.toBe(page)
    expect(listOrganizationEvents).toHaveBeenCalledWith(input)
  })
})
