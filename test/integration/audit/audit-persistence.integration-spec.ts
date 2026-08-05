import type { TestingModule } from '@nestjs/testing'
import { Test } from '@nestjs/testing'

import {
  AUDIT_APPEND_PORT,
  type AuditAppendPort,
} from '../../../src/audit/application/ports/audit-append.port'
import { AuditModule } from '../../../src/audit/audit.module'
import { AuditEvent } from '../../../src/audit/domain/audit-event'
import { ConfigurationModule } from '../../../src/shared/infrastructure/config/configuration.module'
import { DatabaseModule } from '../../../src/shared/infrastructure/database/database.module'
import { PrismaService } from '../../../src/shared/infrastructure/database/prisma.service'

const EVENT_ID = '00000000-0000-4000-8000-000000001611'
const IMMUTABLE_EVENT_ID = '00000000-0000-4000-8000-000000001612'
const ACTOR_ID = '00000000-0000-4000-8000-000000001613'
const ORGANIZATION_ID = '00000000-0000-4000-8000-000000001614'
const TARGET_ID = '00000000-0000-4000-8000-000000001615'
const NOW = new Date('2026-01-01T10:00:00.000Z')

describe('audit persistence', () => {
  let module: TestingModule
  let prisma: PrismaService
  let audit: AuditAppendPort

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [ConfigurationModule, DatabaseModule, AuditModule],
    }).compile()
    await module.init()

    prisma = module.get(PrismaService)
    audit = module.get(AUDIT_APPEND_PORT)
  })

  afterAll(async () => {
    await module.close()
  })

  it('appends tenant-owned events with only allowlisted metadata', async () => {
    await audit.append(
      createRoleChangeEvent(EVENT_ID, {
        previousRole: 'member',
        role: 'admin',
        password: 'plain-secret',
        refreshToken: 'refresh-secret',
        authorization: 'Bearer secret',
        cookie: 'session=secret',
        body: { unrestricted: true },
      }),
    )

    await expect(prisma.auditEvent.findUniqueOrThrow({ where: { id: EVENT_ID } })).resolves.toEqual(
      expect.objectContaining({
        actorUserId: ACTOR_ID,
        organizationId: ORGANIZATION_ID,
        targetId: TARGET_ID,
        metadata: { previousRole: 'member', role: 'admin' },
        occurredAt: NOW,
      }),
    )
  })

  it('rejects updates and deletes at the database boundary', async () => {
    await audit.append(createRoleChangeEvent(IMMUTABLE_EVENT_ID, { role: 'admin' }))

    await expect(
      prisma.auditEvent.update({
        where: { id: IMMUTABLE_EVENT_ID },
        data: { action: 'organization.membership_removed' },
      }),
    ).rejects.toThrow('audit events are immutable')
    await expect(prisma.auditEvent.delete({ where: { id: IMMUTABLE_EVENT_ID } })).rejects.toThrow(
      'audit events are immutable',
    )
    await expect(
      prisma.auditEvent.findUniqueOrThrow({ where: { id: IMMUTABLE_EVENT_ID } }),
    ).resolves.toMatchObject({ action: 'organization.membership_role_changed' })
  })

  function createRoleChangeEvent(
    id: string,
    metadata: Readonly<Record<string, unknown>>,
  ): AuditEvent {
    return AuditEvent.create({
      id,
      actorUserId: ACTOR_ID,
      organizationId: ORGANIZATION_ID,
      action: 'organization.membership_role_changed',
      targetType: 'membership',
      targetId: TARGET_ID,
      requestIdentifier: 'request-123',
      metadata,
      occurredAt: NOW,
    })
  }
})
