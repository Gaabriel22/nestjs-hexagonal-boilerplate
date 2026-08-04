export const CREDENTIAL_AUTHENTICATOR = Symbol('CREDENTIAL_AUTHENTICATOR')

export interface CredentialAuthenticator {
  matches(password: string, passwordHash: string | null): Promise<boolean>
}
