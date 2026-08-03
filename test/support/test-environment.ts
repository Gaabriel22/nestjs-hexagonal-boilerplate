const TEST_ENVIRONMENT = Object.freeze({
  NODE_ENV: 'test',
  AUTH_ACCESS_TOKEN_SECRET: 'test-access-token-secret-at-least-32-characters',
  AUTH_REFRESH_TOKEN_HASH_SECRET: 'test-refresh-token-secret-at-least-32-characters',
  HTTP_BODY_LIMIT_BYTES: '1024',
  RATE_LIMIT_MAX: '2',
})

export function installTestEnvironment(): () => void {
  const previousValues = new Map<string, string | undefined>()
  const testEnvironment = {
    ...TEST_ENVIRONMENT,
    DATABASE_URL: process.env.TEST_DATABASE_URL ?? 'postgresql://app:app@localhost:5432/app_test',
  }

  for (const [key, value] of Object.entries(testEnvironment)) {
    previousValues.set(key, process.env[key])
    process.env[key] = value
  }

  return (): void => {
    for (const [key, previousValue] of previousValues) {
      if (previousValue === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = previousValue
      }
    }
  }
}
