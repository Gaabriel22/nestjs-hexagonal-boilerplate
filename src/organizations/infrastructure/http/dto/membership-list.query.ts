import { Type } from 'class-transformer'
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator'
import { ApiPropertyOptional } from '@nestjs/swagger'

export class MembershipListQuery {
  @ApiPropertyOptional({ format: 'uuid', description: 'Last membership ID from the previous page' })
  @IsOptional()
  @IsUUID('4')
  cursor?: string

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20
}
