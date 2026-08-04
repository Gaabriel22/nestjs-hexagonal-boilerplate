import { WeakPasswordError } from '../errors/weak-password.error'

export const PASSWORD_MIN_LENGTH = 12
export const PASSWORD_MAX_LENGTH = 128

export class PasswordPolicy {
  static assertValid(password: string): void {
    if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
      throw new WeakPasswordError()
    }
  }
}
