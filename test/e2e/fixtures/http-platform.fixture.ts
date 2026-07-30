import { Body, Controller, Get, Module, Post } from '@nestjs/common'
import { Type } from 'class-transformer'
import { IsInt, IsString, Min, MinLength } from 'class-validator'

import { ApplicationError } from '../../../src/shared/application/errors/application.error'
import { DomainError } from '../../../src/shared/domain/errors/domain.error'

export class ValidationProbeDto {
  @IsString()
  @MinLength(2)
  name!: string

  @Type(() => Number)
  @IsInt()
  @Min(1)
  count!: number
}

@Controller({
  path: 'platform-probe',
  version: '1',
})
class HttpPlatformFixtureController {
  @Post('validate')
  validate(@Body() input: ValidationProbeDto): ValidationProbeDto {
    return input
  }

  @Get('application-error')
  applicationError(): never {
    throw new ApplicationError('conflict', 'probe.already_exists', 'Probe already exists')
  }

  @Get('domain-error')
  domainError(): never {
    throw new DomainError('probe.rule_violated', 'Probe rule was violated')
  }

  @Get('unexpected-error')
  unexpectedError(): never {
    throw new Error('internal implementation detail')
  }
}

@Module({
  controllers: [HttpPlatformFixtureController],
})
export class HttpPlatformFixtureModule {}
