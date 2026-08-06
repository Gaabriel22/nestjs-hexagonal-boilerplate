import { IsUUID } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class SessionIdParams {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  sessionId!: string
}
