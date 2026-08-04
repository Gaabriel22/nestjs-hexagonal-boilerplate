import { IsUUID } from 'class-validator'

export class SessionIdParams {
  @IsUUID('4')
  sessionId!: string
}
