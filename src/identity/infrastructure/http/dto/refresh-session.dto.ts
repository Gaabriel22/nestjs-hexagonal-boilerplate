import { IsString, MaxLength, MinLength } from 'class-validator'

export class RefreshSessionDto {
  @IsString()
  @MinLength(20)
  @MaxLength(512)
  refreshToken!: string
}
