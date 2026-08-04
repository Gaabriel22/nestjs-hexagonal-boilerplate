import { Transform, type TransformFnParams } from 'class-transformer'
import { IsDefined, IsString, MaxLength, MinLength } from 'class-validator'

import { normalizeDisplayName } from '../../../application/use-cases/update-current-user-profile'

export class UpdateCurrentUserProfileDto {
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
