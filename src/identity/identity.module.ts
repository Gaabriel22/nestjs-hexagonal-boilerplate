import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'

import { CLOCK, type Clock } from '../shared/application/ports/clock'
import {
  IDENTIFIER_GENERATOR,
  type IdentifierGenerator,
} from '../shared/application/ports/identifier-generator'
import { CryptoIdentifierGenerator } from '../shared/infrastructure/system/crypto-identifier-generator'
import { SystemClock } from '../shared/infrastructure/system/system-clock'
import { PASSWORD_HASHER, type PasswordHasher } from './application/ports/password-hasher'
import {
  ACCESS_TOKEN_SERVICE,
  type AccessTokenService,
} from './application/ports/access-token.service'
import {
  AUTHENTICATION_REPOSITORY,
  type AuthenticationRepository,
} from './application/ports/authentication.repository'
import {
  CREDENTIAL_AUTHENTICATOR,
  type CredentialAuthenticator,
} from './application/ports/credential-authenticator'
import {
  REFRESH_TOKEN_SERVICE,
  type RefreshTokenService,
} from './application/ports/refresh-token.service'
import {
  SESSION_MANAGEMENT_REPOSITORY,
  type SessionManagementRepository,
} from './application/ports/session-management.repository'
import {
  REGISTRATION_REPOSITORY,
  type RegistrationRepository,
} from './application/ports/registration.repository'
import { RegisterUser } from './application/use-cases/register-user'
import { AuthenticateAccessToken } from './application/use-cases/authenticate-access-token'
import { Login } from './application/use-cases/login'
import { ListActiveSessions } from './application/use-cases/list-active-sessions'
import { LogoutCurrentSession } from './application/use-cases/logout-current-session'
import { RefreshSession } from './application/use-cases/refresh-session'
import { RevokeOwnedSession } from './application/use-cases/revoke-owned-session'
import { CREDENTIAL_REPOSITORY } from './domain/repositories/credential.repository'
import { SESSION_REPOSITORY } from './domain/repositories/session.repository'
import { USER_REPOSITORY } from './domain/repositories/user.repository'
import { IdentityController } from './infrastructure/http/identity.controller'
import { AccessAuthenticationGuard } from './infrastructure/http/access-authentication.guard'
import { PrismaAuthenticationRepository } from './infrastructure/persistence/prisma/repositories/prisma-authentication.repository'
import { PrismaCredentialRepository } from './infrastructure/persistence/prisma/repositories/prisma-credential.repository'
import { PrismaRegistrationRepository } from './infrastructure/persistence/prisma/repositories/prisma-registration.repository'
import { PrismaSessionRepository } from './infrastructure/persistence/prisma/repositories/prisma-session.repository'
import { PrismaSessionManagementRepository } from './infrastructure/persistence/prisma/repositories/prisma-session-management.repository'
import { PrismaUserRepository } from './infrastructure/persistence/prisma/repositories/prisma-user.repository'
import { Argon2idPasswordHasher } from './infrastructure/security/argon2id-password-hasher'
import { Argon2idCredentialAuthenticator } from './infrastructure/security/argon2id-credential-authenticator'
import { HmacRefreshTokenService } from './infrastructure/security/hmac-refresh-token.service'
import { JwtAccessTokenService } from './infrastructure/security/jwt-access-token.service'

@Module({
  imports: [JwtModule.register({})],
  controllers: [IdentityController],
  providers: [
    PrismaUserRepository,
    PrismaCredentialRepository,
    PrismaSessionRepository,
    PrismaRegistrationRepository,
    Argon2idPasswordHasher,
    CryptoIdentifierGenerator,
    SystemClock,
    PrismaAuthenticationRepository,
    Argon2idCredentialAuthenticator,
    JwtAccessTokenService,
    HmacRefreshTokenService,
    PrismaSessionManagementRepository,
    AccessAuthenticationGuard,
    {
      provide: USER_REPOSITORY,
      useExisting: PrismaUserRepository,
    },
    {
      provide: CREDENTIAL_REPOSITORY,
      useExisting: PrismaCredentialRepository,
    },
    {
      provide: SESSION_REPOSITORY,
      useExisting: PrismaSessionRepository,
    },
    {
      provide: REGISTRATION_REPOSITORY,
      useExisting: PrismaRegistrationRepository,
    },
    {
      provide: PASSWORD_HASHER,
      useExisting: Argon2idPasswordHasher,
    },
    {
      provide: IDENTIFIER_GENERATOR,
      useExisting: CryptoIdentifierGenerator,
    },
    {
      provide: CLOCK,
      useExisting: SystemClock,
    },
    {
      provide: AUTHENTICATION_REPOSITORY,
      useExisting: PrismaAuthenticationRepository,
    },
    {
      provide: CREDENTIAL_AUTHENTICATOR,
      useExisting: Argon2idCredentialAuthenticator,
    },
    {
      provide: ACCESS_TOKEN_SERVICE,
      useExisting: JwtAccessTokenService,
    },
    {
      provide: REFRESH_TOKEN_SERVICE,
      useExisting: HmacRefreshTokenService,
    },
    {
      provide: SESSION_MANAGEMENT_REPOSITORY,
      useExisting: PrismaSessionManagementRepository,
    },
    {
      provide: RegisterUser,
      inject: [PASSWORD_HASHER, REGISTRATION_REPOSITORY, IDENTIFIER_GENERATOR, CLOCK],
      useFactory: (
        passwordHasher: PasswordHasher,
        registrationRepository: RegistrationRepository,
        identifierGenerator: IdentifierGenerator,
        clock: Clock,
      ): RegisterUser =>
        new RegisterUser(passwordHasher, registrationRepository, identifierGenerator, clock),
    },
    {
      provide: Login,
      inject: [
        AUTHENTICATION_REPOSITORY,
        CREDENTIAL_AUTHENTICATOR,
        ACCESS_TOKEN_SERVICE,
        REFRESH_TOKEN_SERVICE,
        IDENTIFIER_GENERATOR,
        CLOCK,
      ],
      useFactory: (
        repository: AuthenticationRepository,
        credentialAuthenticator: CredentialAuthenticator,
        accessTokens: AccessTokenService,
        refreshTokens: RefreshTokenService,
        identifiers: IdentifierGenerator,
        clock: Clock,
      ): Login =>
        new Login(
          repository,
          credentialAuthenticator,
          accessTokens,
          refreshTokens,
          identifiers,
          clock,
        ),
    },
    {
      provide: AuthenticateAccessToken,
      inject: [ACCESS_TOKEN_SERVICE, AUTHENTICATION_REPOSITORY, CLOCK],
      useFactory: (
        accessTokens: AccessTokenService,
        repository: AuthenticationRepository,
        clock: Clock,
      ): AuthenticateAccessToken => new AuthenticateAccessToken(accessTokens, repository, clock),
    },
    {
      provide: RefreshSession,
      inject: [SESSION_MANAGEMENT_REPOSITORY, ACCESS_TOKEN_SERVICE, REFRESH_TOKEN_SERVICE, CLOCK],
      useFactory: (
        repository: SessionManagementRepository,
        accessTokens: AccessTokenService,
        refreshTokens: RefreshTokenService,
        clock: Clock,
      ): RefreshSession => new RefreshSession(repository, accessTokens, refreshTokens, clock),
    },
    {
      provide: LogoutCurrentSession,
      inject: [SESSION_MANAGEMENT_REPOSITORY, CLOCK],
      useFactory: (repository: SessionManagementRepository, clock: Clock): LogoutCurrentSession =>
        new LogoutCurrentSession(repository, clock),
    },
    {
      provide: ListActiveSessions,
      inject: [SESSION_MANAGEMENT_REPOSITORY, CLOCK],
      useFactory: (repository: SessionManagementRepository, clock: Clock): ListActiveSessions =>
        new ListActiveSessions(repository, clock),
    },
    {
      provide: RevokeOwnedSession,
      inject: [SESSION_MANAGEMENT_REPOSITORY, CLOCK],
      useFactory: (repository: SessionManagementRepository, clock: Clock): RevokeOwnedSession =>
        new RevokeOwnedSession(repository, clock),
    },
  ],
  exports: [
    USER_REPOSITORY,
    CREDENTIAL_REPOSITORY,
    SESSION_REPOSITORY,
    AccessAuthenticationGuard,
    AuthenticateAccessToken,
  ],
})
export class IdentityModule {}
