import { ApiProperty } from '@nestjs/swagger'

export class DependencyHealthResponse {
  @ApiProperty({ enum: ['up', 'down'], example: 'up' })
  readonly postgresql: 'up' | 'down'

  constructor(postgresql: 'up' | 'down') {
    this.postgresql = postgresql
  }
}

export class LivenessResponse {
  @ApiProperty({ enum: ['live'], example: 'live' })
  readonly status = 'live' as const
}

export class ReadinessResponse {
  @ApiProperty({ enum: ['ready', 'not_ready'], example: 'ready' })
  readonly status: 'ready' | 'not_ready'

  @ApiProperty({ type: DependencyHealthResponse })
  readonly checks: DependencyHealthResponse

  constructor(status: 'ready' | 'not_ready', postgresql: 'up' | 'down') {
    this.status = status
    this.checks = new DependencyHealthResponse(postgresql)
  }
}
