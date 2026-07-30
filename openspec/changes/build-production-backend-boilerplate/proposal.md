## Why

New backend projects need a production-oriented starting point that already establishes reliable architecture, security, testing, operations, and local infrastructure conventions. Building these foundations once as a reusable boilerplate reduces repeated setup work and prevents core engineering concerns from becoming late, inconsistent additions.

## What Changes

- Establish a NestJS application using Fastify, TypeScript, Prisma ORM, and PostgreSQL.
- Enforce deterministic source formatting with Prettier in local and automated quality workflows.
- Organize business modules with pragmatic Hexagonal Architecture, tactical DDD, and inward-only dependencies.
- Provide standardized configuration, validation, error responses, API versioning, and Scalar API reference.
- Add user registration and profile management, credential authentication, renewable sessions, logout, and session revocation.
- Add organizations with tenant membership and role-based permission checks.
- Record security-sensitive and administrative actions in an audit trail.
- Add structured logs, request correlation, health/readiness endpoints, and baseline metrics.
- Add isolated unit, integration, architecture, and end-to-end test suites with automated quality gates.
- Provide reproducible development and production containers for the API and PostgreSQL.
- Deliver the work incrementally through independently verifiable implementation slices.

## Capabilities

### New Capabilities

- `application-foundation`: Project bootstrap, modular architecture boundaries, typed configuration, and shared application conventions.
- `api-platform`: HTTP lifecycle, versioning, validation, standardized errors, security defaults, and Scalar API reference.
- `identity-and-sessions`: Credential-based registration, authentication, access tokens, renewable sessions, logout, and revocation.
- `user-management`: Authenticated user profile retrieval and maintenance.
- `organization-access-control`: Organizations, memberships, tenant isolation, roles, and permission enforcement.
- `audit-trail`: Immutable recording and authorized retrieval of relevant audit events.
- `operational-observability`: Structured logging, request correlation, health/readiness checks, and application metrics.
- `quality-assurance`: Prettier formatting plus unit, integration, architecture, and end-to-end testing conventions and quality gates.
- `containerized-runtime`: Reproducible local and production-oriented Docker environments for the API and PostgreSQL.

### Modified Capabilities

None.

## Impact

- Introduces the complete application source tree, database schema and migrations, automated tests, and runtime configuration.
- Adds NestJS, Fastify, Prisma, PostgreSQL, authentication, validation, documentation, logging, metrics, and testing dependencies.
- Defines versioned HTTP endpoints for identity, sessions, users, organizations, memberships, audit events, health, readiness, metrics, and API reference.
- Adds Dockerfile, Docker Compose services, environment templates, Prettier configuration, and CI-ready quality commands.
