import { Transform, type TransformFnParams } from 'class-transformer'
import { IsDefined, IsString, MaxLength, MinLength } from 'class-validator'
import { ApiProperty } from '@nestjs/swagger'

import { normalizeDisplayName } from '../../../application/use-cases/update-current-user-profile'

export class UpdateCurrentUserProfileDto {
  @ApiProperty({ minLength: 2, maxLength: 100, example: 'Ada Lovelace' })
  @Transform((params: TransformFnParams): unknown => {
    const value = params.value as unknown

    return typeof value === 'string' ? normalizeDisplayName(value) : value
  })
  @IsDefined()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  displayName!: string
}
