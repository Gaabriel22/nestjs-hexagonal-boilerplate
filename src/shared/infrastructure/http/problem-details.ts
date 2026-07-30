export interface ValidationProblemField {
  readonly field: string
  readonly messages: readonly string[]
}

export interface ProblemDetails {
  readonly type: string
  readonly title: string
  readonly status: number
  readonly detail: string
  readonly instance: string
  readonly code: string
  readonly requestId?: string
  readonly errors?: readonly ValidationProblemField[]
}
