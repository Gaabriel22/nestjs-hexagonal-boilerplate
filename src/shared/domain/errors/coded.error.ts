export abstract class CodedError extends Error {
  readonly code: string

  protected constructor(code: string, message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = new.target.name
    this.code = code
  }
}
