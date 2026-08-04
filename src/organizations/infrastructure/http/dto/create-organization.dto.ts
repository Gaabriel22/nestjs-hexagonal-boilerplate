import { Transform, type TransformFnParams } from 'class-transformer'
import { IsDefined, IsString, MaxLength, MinLength } from 'class-validator'

export class CreateOrganizationDto {
  @Transform((params: TransformFnParams): unknown => {
    const value = params.value as unknown

    return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value
  })
  @IsDefined()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string
}
