import { Transform, type TransformFnParams } from 'class-transformer'
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator'

import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '../../../domain/services/password-policy'

function normalizeEmailInput({ value }: TransformFnParams): unknown {
  const input: unknown = value

  return typeof input === 'string' ? input.trim().toLowerCase() : input
}

export class RegisterUserDto {
  @Transform(normalizeEmailInput)
  @IsEmail()
  @MaxLength(254)
  email!: string

  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH)
  @MaxLength(PASSWORD_MAX_LENGTH)
  password!: string
}
