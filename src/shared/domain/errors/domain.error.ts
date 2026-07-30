import { CodedError } from './coded.error'

export class DomainError extends CodedError {
  constructor(code: string, message: string, options?: ErrorOptions) {
    super(code, message, options)
  }
}
