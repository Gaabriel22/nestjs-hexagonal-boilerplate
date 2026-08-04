import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'

import { RegisterUser } from '../../application/use-cases/register-user'
import { Login } from '../../application/use-cases/login'
import { LoginDto } from './dto/login.dto'
import { LoginResponse } from './dto/login.response'
import { RegisterUserDto } from './dto/register-user.dto'
import { RegisteredUserResponse } from './dto/registered-user.response'

@Controller({
  path: 'auth',
  version: '1',
})
export class IdentityController {
  constructor(
    private readonly registerUser: RegisterUser,
    private readonly loginUser: Login,
  ) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() input: RegisterUserDto): Promise<RegisteredUserResponse> {
    const result = await this.registerUser.execute(input)

    return new RegisteredUserResponse(result)
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() input: LoginDto): Promise<LoginResponse> {
    return new LoginResponse(await this.loginUser.execute(input))
  }
}
