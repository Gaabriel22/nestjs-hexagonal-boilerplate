import { Injectable } from '@nestjs/common'

import type { AuditAppendPort } from '../../application/ports/audit-append.port'
import type { AuditEvent } from '../../domain/audit-event'
import { PrismaService } from '../../../shared/infrastructure/database/prisma.service'

@Injectable()
export class PrismaAuditAppendAdapter implements AuditAppendPort {
  constructor(private readonly prisma: PrismaService) {}

  async append(event: AuditEvent): Promise<void> {
    await this.prisma.auditEvent.create({ data: event.toPrimitives() })
  }
}
