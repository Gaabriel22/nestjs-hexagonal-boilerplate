import { InvalidEmailError } from '../errors/invalid-email.error'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_EMAIL_LENGTH = 254

export class NormalizedEmail {
  private constructor(readonly value: string) {}

  static create(input: string): NormalizedEmail {
    const value = input.trim().toLowerCase()

    if (value.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(value)) {
      throw new InvalidEmailError()
    }

    return new NormalizedEmail(value)
  }
}
