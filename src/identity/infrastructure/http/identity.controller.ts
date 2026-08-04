import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common'

import type { AccessTokenClaims } from '../../application/ports/access-token.service'
import { ListActiveSessions } from '../../application/use-cases/list-active-sessions'
import { LogoutCurrentSession } from '../../application/use-cases/logout-current-session'
import { RefreshSession } from '../../application/use-cases/refresh-session'
import { RegisterUser } from '../../application/use-cases/register-user'
import { RevokeOwnedSession } from '../../application/use-cases/revoke-owned-session'
import { Login } from '../../application/use-cases/login'
import { AccessAuthenticationGuard } from './access-authentication.guard'
import { CurrentIdentity } from './current-identity.decorator'
import { LoginDto } from './dto/login.dto'
import { LoginResponse } from './dto/login.response'
import { RefreshSessionDto } from './dto/refresh-session.dto'
import { RefreshSessionResponse } from './dto/refresh-session.response'
import { RegisterUserDto } from './dto/register-user.dto'
import { RegisteredUserResponse } from './dto/registered-user.response'
import { SessionIdParams } from './dto/session-id.params'
import { SessionListResponse } from './dto/session.response'

@Controller({
  path: 'auth',
  version: '1',
})
export class IdentityController {
  constructor(
    private readonly registerUser: RegisterUser,
    private readonly loginUser: Login,
    private readonly refreshSession: RefreshSession,
    private readonly logoutCurrentSession: LogoutCurrentSession,
    private readonly listActiveSessions: ListActiveSessions,
    private readonly revokeOwnedSession: RevokeOwnedSession,
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

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() input: RefreshSessionDto): Promise<RefreshSessionResponse> {
    return new RefreshSessionResponse(await this.refreshSession.execute(input.refreshToken))
  }

  @Post('logout')
  @UseGuards(AccessAuthenticationGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@CurrentIdentity() identity: AccessTokenClaims): Promise<void> {
    await this.logoutCurrentSession.execute(identity.userId, identity.sessionId)
  }

  @Get('sessions')
  @UseGuards(AccessAuthenticationGuard)
  async sessions(@CurrentIdentity() identity: AccessTokenClaims): Promise<SessionListResponse> {
    return new SessionListResponse(
      await this.listActiveSessions.execute(identity.userId, identity.sessionId),
    )
  }

  @Delete('sessions/:sessionId')
  @UseGuards(AccessAuthenticationGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async revokeSession(
    @CurrentIdentity() identity: AccessTokenClaims,
    @Param() params: SessionIdParams,
  ): Promise<void> {
    await this.revokeOwnedSession.execute(identity.userId, params.sessionId)
  }
}
