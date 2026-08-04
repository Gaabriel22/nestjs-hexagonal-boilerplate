import { Transform, type TransformFnParams } from 'class-transformer'
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator'

function normalizeEmailInput({ value }: TransformFnParams): unknown {
  const input: unknown = value
  return typeof input === 'string' ? input.trim().toLowerCase() : input
}

export class LoginDto {
  @Transform(normalizeEmailInput)
  @IsEmail()
  @MaxLength(254)
  email!: string

  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password!: string
}
