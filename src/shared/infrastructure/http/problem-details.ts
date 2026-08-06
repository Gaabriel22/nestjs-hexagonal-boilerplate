import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class ValidationProblemField {
  @ApiProperty({ example: 'email' })
  readonly field!: string

  @ApiProperty({ type: [String], example: ['email must be an email'] })
  readonly messages!: readonly string[]
}

export class ProblemDetails {
  @ApiProperty({ example: 'urn:problem:request.validation_failed' })
  readonly type!: string

  @ApiProperty({ example: 'Bad Request' })
  readonly title!: string

  @ApiProperty({ example: 400 })
  readonly status!: number

  @ApiProperty({ example: 'Request validation failed' })
  readonly detail!: string

  @ApiProperty({ example: '/api/v1/auth/register' })
  readonly instance!: string

  @ApiProperty({ example: 'request.validation_failed' })
  readonly code!: string

  @ApiPropertyOptional({ example: 'req-1' })
  readonly requestId?: string

  @ApiPropertyOptional({ type: () => [ValidationProblemField] })
  readonly errors?: readonly ValidationProblemField[]
}
