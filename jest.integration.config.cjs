const base = require('./jest.base.config.cjs')

/** @type {import('jest').Config} */
module.exports = {
  ...base,
  displayName: 'integration',
  testMatch: ['<rootDir>/test/integration/**/*.integration-spec.ts'],
}
