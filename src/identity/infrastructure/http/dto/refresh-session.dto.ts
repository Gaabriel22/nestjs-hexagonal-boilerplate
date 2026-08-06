import { IsString, MaxLength, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

export class RefreshSessionDto {
  @ApiProperty({ type: String, minLength: 20, maxLength: 512, writeOnly: true })
  @IsString()
  @MinLength(20)
  @MaxLength(512)
  refreshToken!: string
}
