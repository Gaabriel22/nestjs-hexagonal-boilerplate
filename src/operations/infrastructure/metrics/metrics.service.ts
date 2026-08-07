import { Injectable, type OnModuleDestroy } from '@nestjs/common'
import { collectDefaultMetrics, Counter, Histogram, Registry } from 'prom-client'

export interface HttpRequestMetric {
  readonly method: string
  readonly route: string
  readonly statusCode: number
  readonly durationMilliseconds: number
}

const HTTP_LABELS = ['method', 'route', 'status_code'] as const

@Injectable()
export class MetricsService implements OnModuleDestroy {
  private readonly registry = new Registry()
  private readonly requestCount = new Counter({
    name: 'boilerplate_http_requests_total',
    help: 'Total number of completed HTTP requests',
    labelNames: HTTP_LABELS,
    registers: [this.registry],
  })
  private readonly requestDuration = new Histogram({
    name: 'boilerplate_http_request_duration_seconds',
    help: 'Duration of completed HTTP requests in seconds',
    labelNames: HTTP_LABELS,
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
    registers: [this.registry],
  })

  constructor() {
    collectDefaultMetrics({
      prefix: 'boilerplate_',
      register: this.registry,
    })
  }

  recordHttpRequest(metric: HttpRequestMetric): void {
    const labels = {
      method: metric.method,
      route: metric.route,
      status_code: String(metric.statusCode),
    }

    this.requestCount.inc(labels)
    this.requestDuration.observe(labels, metric.durationMilliseconds / 1000)
  }

  render(): Promise<string> {
    return this.registry.metrics()
  }

  contentType(): string {
    return this.registry.contentType
  }

  onModuleDestroy(): void {
    this.registry.clear()
  }
}
