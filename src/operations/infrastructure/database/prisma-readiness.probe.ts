import { Injectable } from '@nestjs/common'

import type { ReadinessProbe } from '../../application/ports/readiness-probe'
import { PrismaService } from '../../../shared/infrastructure/database/prisma.service'

@Injectable()
export class PrismaReadinessProbe implements ReadinessProbe {
  constructor(private readonly prisma: PrismaService) {}

  async check(): Promise<void> {
    await this.prisma.$queryRaw`SELECT 1`
  }
}
