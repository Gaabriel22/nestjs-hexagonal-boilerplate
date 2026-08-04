import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'

import { RegisterUser } from '../../application/use-cases/register-user'
import { RegisterUserDto } from './dto/register-user.dto'
import { RegisteredUserResponse } from './dto/registered-user.response'

@Controller({
  path: 'auth',
  version: '1',
})
export class IdentityController {
  constructor(private readonly registerUser: RegisterUser) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() input: RegisterUserDto): Promise<RegisteredUserResponse> {
    const result = await this.registerUser.execute(input)

    return new RegisteredUserResponse(result)
  }
}
