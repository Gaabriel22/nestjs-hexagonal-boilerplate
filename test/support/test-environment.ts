const TEST_ENVIRONMENT = Object.freeze({
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://app:app@localhost:5432/app_test',
  AUTH_ACCESS_TOKEN_SECRET: 'test-access-token-secret-at-least-32-characters',
  AUTH_REFRESH_TOKEN_HASH_SECRET: 'test-refresh-token-secret-at-least-32-characters',
})

export function installTestEnvironment(): () => void {
  const previousValues = new Map<string, string | undefined>()

  for (const [key, value] of Object.entries(TEST_ENVIRONMENT)) {
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
