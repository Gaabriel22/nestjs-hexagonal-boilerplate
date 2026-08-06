import type { TestingModule } from '@nestjs/testing'
import { Test } from '@nestjs/testing'

import {
  AUDIT_APPEND_PORT,
  type AuditAppendPort,
} from '../../../src/audit/application/ports/audit-append.port'
import {
  AUDIT_QUERY_PORT,
  type AuditQueryPort,
} from '../../../src/audit/application/ports/audit-query.port'
import { AuditModule } from '../../../src/audit/audit.module'
import { AuditEvent, type AuditAction } from '../../../src/audit/domain/audit-event'
import { ConfigurationModule } from '../../../src/shared/infrastructure/config/configuration.module'
import { DatabaseModule } from '../../../src/shared/infrastructure/database/database.module'

const ORGANIZATION_ID = '00000000-0000-4000-8000-000000001711'
const OTHER_ORGANIZATION_ID = '00000000-0000-4000-8000-000000001712'
const ACTOR_ID = '00000000-0000-4000-8000-000000001713'
const OTHER_ACTOR_ID = '00000000-0000-4000-8000-000000001714'
const TARGET_ID = '00000000-0000-4000-8000-000000001715'
const OTHER_TARGET_ID = '00000000-0000-4000-8000-000000001716'
const EVENT_IDS = [
  '00000000-0000-4000-8000-000000001721',
  '00000000-0000-4000-8000-000000001722',
  '00000000-0000-4000-8000-000000001723',
  '00000000-0000-4000-8000-000000001724',
  '00000000-0000-4000-8000-000000001725',
] as const
const FOREIGN_EVENT_ID = '00000000-0000-4000-8000-000000001726'

describe('audit query persistence', () => {
  let module: TestingModule
  let audit: AuditAppendPort
  let queries: AuditQueryPort

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ConfigurationModule, DatabaseModule, AuditModule],
    }).compile()
    await module.init()

    audit = module.get(AUDIT_APPEND_PORT)
    queries = module.get(AUDIT_QUERY_PORT)

    await Promise.all([
      append(EVENT_IDS[0], ORGANIZATION_ID, ACTOR_ID, 'organization.created', '10:00:00'),
      append(EVENT_IDS[1], ORGANIZATION_ID, ACTOR_ID, 'organization.created', '11:00:00'),
      append(
        EVENT_IDS[2],
        ORGANIZATION_ID,
        OTHER_ACTOR_ID,
        'organization.membership_role_changed',
        '12:00:00',
      ),
      append(
        EVENT_IDS[3],
        ORGANIZATION_ID,
        ACTOR_ID,
        'organization.membership_role_changed',
        '12:00:00',
      ),
      append(
        EVENT_IDS[4],
        ORGANIZATION_ID,
        ACTOR_ID,
        'organization.membership_removed',
        '13:00:00',
      ),
      append(
        FOREIGN_EVENT_ID,
        OTHER_ORGANIZATION_ID,
        ACTOR_ID,
        'organization.membership_removed',
        '14:00:00',
      ),
    ])
  })

  afterAll(async () => {
    await module.close()
  })

  it('cursor-paginates deterministically within the requested tenant', async () => {
    const first = await queries.listOrganizationEvents({
      organizationId: ORGANIZATION_ID,
      limit: 2,
    })
    const second = await queries.listOrganizationEvents({
      organizationId: ORGANIZATION_ID,
      cursor: first.nextCursor ?? undefined,
      limit: 2,
    })
    const third = await queries.listOrganizationEvents({
      organizationId: ORGANIZATION_ID,
      cursor: second.nextCursor ?? undefined,
      limit: 2,
    })

    expect(first.events.map(({ id }) => id)).toEqual([EVENT_IDS[4], EVENT_IDS[3]])
    expect(first.nextCursor).toBe(EVENT_IDS[3])
    expect(second.events.map(({ id }) => id)).toEqual([EVENT_IDS[2], EVENT_IDS[1]])
    expect(second.nextCursor).toBe(EVENT_IDS[1])
    expect(third.events.map(({ id }) => id)).toEqual([EVENT_IDS[0]])
    expect(third.nextCursor).toBeNull()
    expect([...first.events, ...second.events, ...third.events]).toHaveLength(5)
  })

  it('applies supported action, actor, target and occurrence filters', async () => {
    const byAction = await queries.listOrganizationEvents({
      organizationId: ORGANIZATION_ID,
      limit: 20,
      action: 'organization.membership_role_changed',
    })
    const byActor = await queries.listOrganizationEvents({
      organizationId: ORGANIZATION_ID,
      limit: 20,
      actorUserId: OTHER_ACTOR_ID,
    })
    const byTarget = await queries.listOrganizationEvents({
      organizationId: ORGANIZATION_ID,
      limit: 20,
      targetType: 'membership',
      targetId: TARGET_ID,
    })
    const byOccurrence = await queries.listOrganizationEvents({
      organizationId: ORGANIZATION_ID,
      limit: 20,
      occurredFrom: new Date('2026-01-01T11:30:00.000Z'),
      occurredTo: new Date('2026-01-01T12:00:00.000Z'),
    })

    expect(byAction.events.map(({ id }) => id)).toEqual([EVENT_IDS[3], EVENT_IDS[2]])
    expect(byActor.events.map(({ id }) => id)).toEqual([EVENT_IDS[2]])
    expect(byTarget.events.map(({ id }) => id)).toEqual([EVENT_IDS[4], EVENT_IDS[3], EVENT_IDS[2]])
    expect(byOccurrence.events.map(({ id }) => id)).toEqual([EVENT_IDS[3], EVENT_IDS[2]])
  })

  it('never returns foreign events or accepts a foreign tenant cursor', async () => {
    const page = await queries.listOrganizationEvents({
      organizationId: ORGANIZATION_ID,
      limit: 20,
    })
    const crossTenantCursor = await queries.listOrganizationEvents({
      organizationId: ORGANIZATION_ID,
      cursor: FOREIGN_EVENT_ID,
      limit: 20,
    })

    expect(page.events.every((event) => event.organizationId === ORGANIZATION_ID)).toBe(true)
    expect(page.events.map(({ id }) => id)).not.toContain(FOREIGN_EVENT_ID)
    expect(crossTenantCursor).toEqual({ events: [], nextCursor: null })
  })

  function append(
    id: string,
    organizationId: string,
    actorUserId: string,
    action: AuditAction,
    time: string,
  ): Promise<void> {
    const membershipAction = action !== 'organization.created'

    return audit.append(
      AuditEvent.create({
        id,
        actorUserId,
        organizationId,
        action,
        targetType: membershipAction ? 'membership' : 'organization',
        targetId: membershipAction ? TARGET_ID : OTHER_TARGET_ID,
        requestIdentifier: `request-${id}`,
        metadata: membershipAction
          ? { previousRole: 'member', role: 'admin', password: 'must-not-leak' }
          : {},
        occurredAt: new Date(`2026-01-01T${time}.000Z`),
      }),
    )
  }
})
