/** @type {import('jest').Config} */
module.exports = {
  collectCoverageFrom: ['src/**/*.ts', '!src/main.ts'],
  projects: [
    '<rootDir>/jest.unit.config.cjs',
    '<rootDir>/jest.integration.config.cjs',
    '<rootDir>/jest.architecture.config.cjs',
    '<rootDir>/jest.e2e.config.cjs',
  ],
}
