import { Transform, type TransformFnParams } from 'class-transformer'
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

function normalizeEmailInput({ value }: TransformFnParams): unknown {
  const input: unknown = value
  return typeof input === 'string' ? input.trim().toLowerCase() : input
}

export class LoginDto {
  @ApiProperty({ format: 'email', maxLength: 254, example: 'developer@example.com' })
  @Transform(normalizeEmailInput)
  @IsEmail()
  @MaxLength(254)
  email!: string

  @ApiProperty({ type: String, minLength: 1, maxLength: 128, writeOnly: true })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password!: string
}
