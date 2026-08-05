import { Module } from '@nestjs/common'

import { AUDIT_APPEND_PORT } from './application/ports/audit-append.port'
import { PrismaAuditAppendAdapter } from './infrastructure/persistence/prisma-audit-append.adapter'

@Module({
  providers: [
    PrismaAuditAppendAdapter,
    { provide: AUDIT_APPEND_PORT, useExisting: PrismaAuditAppendAdapter },
  ],
  exports: [AUDIT_APPEND_PORT],
})
export class AuditModule {}
