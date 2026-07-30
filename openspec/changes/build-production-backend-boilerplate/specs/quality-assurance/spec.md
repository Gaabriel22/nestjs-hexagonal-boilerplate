## ADDED Requirements

### Requirement: Canonical Prettier formatting

The repository SHALL define one committed Prettier configuration and ignore generated, dependency, coverage, and build artifacts.

#### Scenario: Developer formats supported files

- **WHEN** the developer runs the canonical format command
- **THEN** Prettier rewrites supported project files to the repository format

#### Scenario: Automation checks formatting

- **WHEN** the non-mutating format check runs on incorrectly formatted files
- **THEN** the command fails and identifies files requiring formatting

### Requirement: Independent quality commands

The repository SHALL expose independently runnable commands for formatting checks, linting, type checking, unit tests, integration tests, architecture tests, end-to-end tests, coverage, and production build.

#### Scenario: One quality layer fails

- **WHEN** a developer runs the corresponding command
- **THEN** the command exits unsuccessfully without requiring unrelated suites to run first

### Requirement: Isolated unit tests

The system SHALL unit test domain behavior and application use cases without network access or a real database.

#### Scenario: Unit suite runs

- **WHEN** the unit test command executes
- **THEN** tests use deterministic fakes or mocks and pass independently of execution order

### Requirement: PostgreSQL integration tests

The system SHALL test Prisma mappings, repositories, transactions, constraints, and migrations against a dedicated PostgreSQL test database.

#### Scenario: Integration suite runs

- **WHEN** an isolated test database is available
- **THEN** each integration test starts from known state and cannot access development or production data

### Requirement: HTTP end-to-end tests

The system SHALL exercise representative success, validation, authentication, authorization, tenant isolation, and error flows through the complete NestJS Fastify application.

#### Scenario: End-to-end suite runs

- **WHEN** the application test harness starts
- **THEN** requests are injected through Fastify and managed resources are closed after the suite

### Requirement: Commit-ready verification checkpoints

Each implementation task group SHALL define a focused acceptance check and a commit checkpoint, and every checkpoint MUST include the Prettier formatting check plus all tests affected by that slice.

#### Scenario: Task group is completed

- **WHEN** its implementation and tests are finished
- **THEN** the documented checks pass before the group is committed
