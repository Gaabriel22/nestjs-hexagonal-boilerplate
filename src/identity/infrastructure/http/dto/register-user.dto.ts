import { Transform, type TransformFnParams } from 'class-transformer'
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '../../../domain/services/password-policy'

function normalizeEmailInput({ value }: TransformFnParams): unknown {
  const input: unknown = value

  return typeof input === 'string' ? input.trim().toLowerCase() : input
}

export class RegisterUserDto {
  @ApiProperty({ format: 'email', maxLength: 254, example: 'developer@example.com' })
  @Transform(normalizeEmailInput)
  @IsEmail()
  @MaxLength(254)
  email!: string

  @ApiProperty({
    type: String,
    minLength: PASSWORD_MIN_LENGTH,
    maxLength: PASSWORD_MAX_LENGTH,
    writeOnly: true,
  })
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(PASSWORD_MAX_LENGTH)
  password!: string
}
