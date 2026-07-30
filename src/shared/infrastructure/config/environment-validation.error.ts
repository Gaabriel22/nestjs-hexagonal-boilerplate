import type { z } from 'zod'

export interface EnvironmentIssue {
  readonly path: string
  readonly message: string
}

const SENSITIVE_PATHS = new Set([
  'AUTH_ACCESS_TOKEN_SECRET',
  'AUTH_REFRESH_TOKEN_HASH_SECRET',
  'DATABASE_URL',
])

function mapIssue(issue: z.core.$ZodIssue): EnvironmentIssue {
  const path = issue.path.join('.') || 'environment'

  return Object.freeze({
    path,
    message: SENSITIVE_PATHS.has(path) ? 'is required or invalid' : issue.message,
  })
}

export class EnvironmentValidationError extends Error {
  readonly issues: readonly EnvironmentIssue[]

  constructor(zodIssues: readonly z.core.$ZodIssue[]) {
    const issues = Object.freeze(zodIssues.map(mapIssue))
    const diagnostics = issues.map((issue) => `- ${issue.path}: ${issue.message}`).join('\n')

    super(`Invalid environment configuration:\n${diagnostics}`)
    this.name = EnvironmentValidationError.name
    this.issues = issues
  }
}
