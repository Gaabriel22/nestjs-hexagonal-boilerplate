export interface RequestContext {
  getRequestIdentifier(): string | null
}

export const REQUEST_CONTEXT = Symbol('REQUEST_CONTEXT')

export const EMPTY_REQUEST_CONTEXT: RequestContext = Object.freeze({
  getRequestIdentifier: (): null => null,
})
