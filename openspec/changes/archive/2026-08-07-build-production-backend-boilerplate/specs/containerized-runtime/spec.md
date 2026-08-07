## ADDED Requirements

### Requirement: Multi-stage API image

The repository SHALL provide a pinned multi-stage Dockerfile with separate dependency, development, build, and production runtime concerns.

#### Scenario: Production image is built

- **WHEN** the production target is built from a clean checkout
- **THEN** compilation succeeds and the final image contains only runtime-required application artifacts and dependencies

### Requirement: Non-root production process

The production container MUST run the application as a dedicated non-root user and MUST receive secrets only at runtime.

#### Scenario: Production container starts

- **WHEN** the production image runs with valid environment configuration
- **THEN** the API process runs as the declared non-root user

### Requirement: Local Docker Compose environment

The repository SHALL provide a Docker Compose environment containing API and PostgreSQL services, health-aware startup, persistent development database storage, and host-accessible development ports.

#### Scenario: Local stack starts

- **WHEN** a developer starts the documented Compose workflow
- **THEN** PostgreSQL becomes healthy and the API becomes ready without manual network configuration

### Requirement: Container health checks

The PostgreSQL service SHALL use a database-native health check, and the API service SHALL use the application's liveness or readiness endpoint as appropriate.

#### Scenario: Dependency is unhealthy

- **WHEN** PostgreSQL has not passed its health check
- **THEN** dependent API startup does not report the stack as ready

### Requirement: Persistent and disposable data workflows

The Compose configuration SHALL use a named volume for development data and the documentation SHALL distinguish ordinary shutdown from destructive volume removal.

#### Scenario: Stack restarts normally

- **WHEN** a developer stops and restarts the stack without requesting volume removal
- **THEN** PostgreSQL development data remains available

### Requirement: Docker build context hygiene

The repository SHALL exclude dependencies, build output, coverage, local environment files, logs, and version-control internals from the Docker build context.

#### Scenario: Docker build context is prepared

- **WHEN** Docker evaluates the repository context
- **THEN** ignored local and sensitive artifacts are not sent to the builder
