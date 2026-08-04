import { Injectable } from '@nestjs/common'
import { verify } from 'argon2'

import type { CredentialAuthenticator } from '../../application/ports/credential-authenticator'

const DUMMY_PASSWORD_HASH =
  '$argon2id$v=19$m=19456,p=1,t=2$SD5eFYJaWzHMYYD6FKIyBA$SbfVX9c7JsmJONz3VFre6e4vNL0tDKNob1jJ+B8ioGg'

@Injectable()
export class Argon2idCredentialAuthenticator implements CredentialAuthenticator {
  matches(password: string, passwordHash: string | null): Promise<boolean> {
    return verify(passwordHash ?? DUMMY_PASSWORD_HASH, password)
  }
}
