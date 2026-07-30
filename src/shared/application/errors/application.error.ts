import { CodedError } from '../../domain/errors/coded.error'

export type ApplicationErrorCategory =
  'bad_request' | 'unauthorized' | 'forbidden' | 'not_found' | 'conflict' | 'unprocessable'

export class ApplicationError extends CodedError {
  readonly category: ApplicationErrorCategory

  constructor(
    category: ApplicationErrorCategory,
    code: string,
    message: string,
    options?: ErrorOptions,
  ) {
    super(code, message, options)
    this.category = category
  }
}
