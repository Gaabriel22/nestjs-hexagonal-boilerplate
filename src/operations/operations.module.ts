import { Module } from '@nestjs/common'

import { CheckReadiness } from './application/use-cases/check-readiness'
import { PrismaReadinessProbe } from './infrastructure/database/prisma-readiness.probe'
import { OperationsController } from './infrastructure/http/operations.controller'
import { MetricsService } from './infrastructure/metrics/metrics.service'

const READINESS_TIMEOUT_MILLISECONDS = 1_000

@Module({
  controllers: [OperationsController],
  providers: [
    PrismaReadinessProbe,
    MetricsService,
    {
      provide: CheckReadiness,
      inject: [PrismaReadinessProbe],
      useFactory: (probe: PrismaReadinessProbe): CheckReadiness =>
        new CheckReadiness(probe, READINESS_TIMEOUT_MILLISECONDS),
    },
  ],
  exports: [MetricsService, PrismaReadinessProbe],
})
export class OperationsModule {}
