import type { ApplicationConfig } from './environment.schema'
import { environmentSchema } from './environment.schema'
import { EnvironmentValidationError } from './environment-validation.error'

export function parseEnvironment(input: Record<string, unknown>): ApplicationConfig {
  const result = environmentSchema.safeParse(input)

  if (!result.success) {
    throw new EnvironmentValidationError(result.error.issues)
  }

  return result.data
}
