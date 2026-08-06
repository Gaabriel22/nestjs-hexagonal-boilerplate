import { Module } from '@nestjs/common'

import { IdentityModule } from '../identity/identity.module'
import { OrganizationsModule } from '../organizations/organizations.module'
import { AUDIT_APPEND_PORT } from './application/ports/audit-append.port'
import { AUDIT_QUERY_PORT, type AuditQueryPort } from './application/ports/audit-query.port'
import { ListOrganizationAuditEvents } from './application/use-cases/list-organization-audit-events'
import { AuditController } from './infrastructure/http/audit.controller'
import { PrismaAuditAppendAdapter } from './infrastructure/persistence/prisma-audit-append.adapter'
import { PrismaAuditQueryAdapter } from './infrastructure/persistence/prisma-audit-query.adapter'

@Module({
  imports: [IdentityModule, OrganizationsModule],
  controllers: [AuditController],
  providers: [
    PrismaAuditAppendAdapter,
    PrismaAuditQueryAdapter,
    { provide: AUDIT_APPEND_PORT, useExisting: PrismaAuditAppendAdapter },
    { provide: AUDIT_QUERY_PORT, useExisting: PrismaAuditQueryAdapter },
    {
      provide: ListOrganizationAuditEvents,
      inject: [AUDIT_QUERY_PORT],
      useFactory: (auditQueries: AuditQueryPort): ListOrganizationAuditEvents =>
        new ListOrganizationAuditEvents(auditQueries),
    },
  ],
  exports: [AUDIT_APPEND_PORT, AUDIT_QUERY_PORT],
})
export class AuditModule {}
