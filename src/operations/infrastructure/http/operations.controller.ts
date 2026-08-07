import { Controller, Get, HttpStatus, Res, VERSION_NEUTRAL } from '@nestjs/common'
import { ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { RouteConfig } from '@nestjs/platform-fastify'
import type { FastifyReply } from 'fastify'

import { CheckReadiness } from '../../application/use-cases/check-readiness'
import { MetricsService } from '../metrics/metrics.service'
import { LivenessResponse, ReadinessResponse } from './dto/health.response'

@Controller({ path: '', version: VERSION_NEUTRAL })
@ApiTags('Operations')
export class OperationsController {
  constructor(
    private readonly checkReadiness: CheckReadiness,
    private readonly metrics: MetricsService,
  ) {}

  @Get('health/live')
  @RouteConfig({ rateLimit: false })
  @ApiOperation({ summary: 'Check whether the application process is live' })
  @ApiOkResponse({ description: 'Application process is live', type: LivenessResponse })
  live(): LivenessResponse {
    return new LivenessResponse()
  }

  @Get('health/ready')
  @RouteConfig({ rateLimit: false })
  @ApiOperation({ summary: 'Check whether required dependencies are ready' })
  @ApiOkResponse({ description: 'Required dependencies are ready', type: ReadinessResponse })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'A required dependency is unavailable',
    type: ReadinessResponse,
  })
  async ready(@Res({ passthrough: true }) reply: FastifyReply): Promise<ReadinessResponse> {
    const readiness = await this.checkReadiness.execute()

    if (readiness.status === 'not_ready') {
      reply.status(HttpStatus.SERVICE_UNAVAILABLE)
    }

    return new ReadinessResponse(readiness.status, readiness.checks.postgresql)
  }

  @Get('metrics')
  @RouteConfig({ rateLimit: false })
  @ApiOperation({ summary: 'Expose Prometheus-compatible application metrics' })
  @ApiOkResponse({
    description: 'Prometheus text exposition format',
    content: {
      'text/plain': {
        schema: { type: 'string' },
      },
    },
  })
  async scrape(@Res({ passthrough: true }) reply: FastifyReply): Promise<string> {
    reply.type(this.metrics.contentType())

    return this.metrics.render()
  }
}
