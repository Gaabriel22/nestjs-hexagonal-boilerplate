## 1. Bootstrap TypeScript and NestJS

- [x] 1.1 Scaffold the npm, TypeScript, NestJS, and Fastify application files without generating feature CRUD code
- [x] 1.2 Add canonical development, build, start, lint, typecheck, and test scripts
- [x] 1.3 Add a minimal Fastify bootstrap and root module with graceful shutdown enabled
- [x] 1.4 Add a bootstrap smoke test that starts and closes the application
- [x] 1.5 Run `npm run lint`, `npm run typecheck`, `npm run test`, and `npm run build`
- [x] 1.6 Commit the verified slice with message `chore: bootstrap NestJS Fastify application`

## 2. Prettier Formatting

- [x] 2.1 Install Prettier as a development dependency and commit the canonical project configuration
- [x] 2.2 Add `.prettierignore` entries for dependencies, generated Prisma code, build output, coverage, and local artifacts
- [x] 2.3 Add `format` and non-mutating `format:check` npm scripts and remove overlapping ESLint formatting rules
- [x] 2.4 Format existing supported files and document editor-independent usage
- [x] 2.5 Run `npm run format:check`, `npm run lint`, `npm run typecheck`, and `npm run test`
- [x] 2.6 Commit the verified slice with message `chore: enforce Prettier formatting`

## 3. Test Harness and Architecture Guardrails

- [x] 3.1 Configure separate unit, integration, architecture, and end-to-end test projects or commands
- [x] 3.2 Add deterministic shared test builders and lifecycle cleanup helpers
- [x] 3.3 Create feature-first folders for shared, identity, users, organizations, and audit modules
- [x] 3.4 Add architecture tests that reject NestJS, Fastify, Prisma, and HTTP imports from domain code
- [x] 3.5 Add architecture tests that reject HTTP and concrete persistence imports from application code
- [x] 3.6 Run `npm run format:check`, `npm run lint`, `npm run typecheck`, and the unit and architecture test commands
- [x] 3.7 Commit the verified slice with message `test: establish layered test harness`

## 4. Typed Configuration

- [x] 4.1 Define the environment schema for application, database, authentication, CORS, rate-limit, logging, and documentation values
- [x] 4.2 Implement immutable typed configuration providers and eliminate direct environment reads outside configuration/bootstrap code
- [x] 4.3 Add safe startup diagnostics that identify invalid configuration without printing secret values
- [x] 4.4 Add unit tests for valid parsing, defaults, missing values, malformed values, and secret redaction
- [x] 4.5 Add `.env.example` with non-secret development placeholders and document required values
- [x] 4.6 Run `npm run format:check`, `npm run lint`, `npm run typecheck`, unit tests, and `npm run build`
- [x] 4.7 Commit the verified slice with message `feat: add typed runtime configuration`

## 5. HTTP Platform Conventions

- [x] 5.1 Add the versioned API prefix and global DTO validation with unknown-property rejection
- [x] 5.2 Define transport-agnostic domain/application error bases and stable public error codes
- [x] 5.3 Implement the global Problem Details exception filter for validation, known, and unexpected errors
- [x] 5.4 Configure Fastify-compatible CORS, security headers, request size, and rate-limit policies
- [x] 5.5 Add end-to-end tests for version routing, valid input, invalid input, known errors, unexpected errors, and request limits
- [x] 5.6 Run `npm run format:check`, `npm run lint`, `npm run typecheck`, unit tests, end-to-end tests, and `npm run build`
- [x] 5.7 Commit the verified slice with message `feat: standardize HTTP platform behavior`

## 6. PostgreSQL and Prisma Foundation

- [x] 6.1 Add Prisma ORM, the PostgreSQL driver adapter, generator configuration, and database lifecycle provider
- [x] 6.2 Add npm scripts for Prisma generation, migration development, migration deployment, and test database preparation
- [x] 6.3 Configure a dedicated PostgreSQL integration-test database guard that rejects unsafe database targets
- [x] 6.4 Add a first connectivity integration test and guarantee client shutdown after suites
- [x] 6.5 Add a migration smoke test that applies all migrations to an empty test database
- [x] 6.6 Run `npm run format:check`, `npm run lint`, `npm run typecheck`, integration tests, and `npm run build`
- [x] 6.7 Commit the verified slice with message `feat: add Prisma PostgreSQL infrastructure`

## 7. Identity Persistence Model

- [x] 7.1 Model users, credentials, and sessions with UUID identifiers, timezone-aware timestamps, constraints, and relations
- [x] 7.2 Add normalized unique email storage and indexes for session ownership, activity, expiry, and token lookup
- [x] 7.3 Generate and review the identity migration SQL for constraints, foreign keys, and indexes
- [x] 7.4 Implement infrastructure mappers and repository adapters behind identity ports
- [x] 7.5 Add integration tests for user uniqueness, session lookup, ownership isolation, expiry fields, and repository mappings
- [x] 7.6 Run `npm run format:check`, `npm run lint`, `npm run typecheck`, architecture tests, integration tests, and `npm run build`
- [x] 7.7 Commit the verified slice with message `feat: add identity persistence model`

## 8. Registration

- [x] 8.1 Implement normalized email and credential domain behavior plus password policy errors
- [x] 8.2 Add the Argon2id password hasher adapter behind an application port
- [x] 8.3 Implement registration as one transaction that creates user and credential records
- [x] 8.4 Add registration DTOs, controller route, safe response model, and Problem Details mappings
- [x] 8.5 Add unit tests for normalization, password hashing orchestration, duplicate email, and rollback behavior
- [x] 8.6 Add end-to-end tests for successful registration, invalid input, duplicate normalized email, and response secrecy
- [x] 8.7 Run `npm run format:check`, `npm run lint`, `npm run typecheck`, affected unit/integration/end-to-end tests, and `npm run build`
- [x] 8.8 Commit the verified slice with message `feat: add user registration`

## 9. Login and Access Authentication

- [x] 9.1 Implement constant-public-response credential authentication for unknown users and invalid passwords
- [x] 9.2 Add signed short-lived access token creation and verification behind application ports
- [x] 9.3 Create sessions during successful login while persisting only the keyed refresh-token hash
- [x] 9.4 Add login DTOs, controller route, authentication guard, and current request identity context
- [x] 9.5 Enforce current user and session activity on protected requests
- [x] 9.6 Add unit tests for credential outcomes, access claims, inactive users, and revoked sessions
- [x] 9.7 Add end-to-end tests for login success, uniform invalid credentials, missing token, expired token, and invalid token
- [x] 9.8 Run `npm run format:check`, `npm run lint`, `npm run typecheck`, affected tests, and `npm run build`
- [x] 9.9 Commit the verified slice with message `feat: add login and access authentication`

## 10. Refresh Rotation and Session Revocation

- [x] 10.1 Implement atomic opaque refresh-token rotation with conditional session update
- [x] 10.2 Add reuse detection that revokes the affected session or token family
- [x] 10.3 Implement current-session logout, owned-session listing, and owned-session revocation use cases
- [x] 10.4 Add refresh, logout, session list, and session revoke HTTP routes with safe session DTOs
- [x] 10.5 Add concurrency-focused integration tests for one-time rotation and reuse handling
- [x] 10.6 Add end-to-end tests for refresh success, reuse rejection, logout, owned revocation, and foreign-session concealment
- [x] 10.7 Run `npm run format:check`, `npm run lint`, `npm run typecheck`, affected tests, and `npm run build`
- [x] 10.8 Commit the verified slice with message `feat: add renewable session management`

## 11. Current User Profile

- [x] 11.1 Implement current-user profile query and safe application result
- [x] 11.2 Implement supported profile updates with immutable and unknown field rejection
- [x] 11.3 Add current-user GET and PATCH routes with documented DTOs
- [x] 11.4 Add unit and integration tests for reads, valid updates, invalid updates, and persistence mapping
- [x] 11.5 Add end-to-end tests for profile secrecy, updates, unauthenticated access, and deactivated-user rejection
- [x] 11.6 Run `npm run format:check`, `npm run lint`, `npm run typecheck`, affected tests, and `npm run build`
- [x] 11.7 Commit the verified slice with message `feat: add current user profile`

## 12. Organization Persistence and Creation

- [x] 12.1 Model organizations and memberships with role, active state, timestamps, constraints, and tenant lookup indexes
- [x] 12.2 Generate and review the organization migration SQL and foreign-key behavior
- [x] 12.3 Define organization and membership domain behavior, repositories, mappers, and application ports
- [x] 12.4 Implement atomic organization creation with creator owner membership
- [x] 12.5 Add the organization creation route and safe response DTO
- [x] 12.6 Add unit, integration, and end-to-end tests for successful creation, rollback, and owner assignment
- [x] 12.7 Run `npm run format:check`, `npm run lint`, `npm run typecheck`, architecture tests, affected tests, and `npm run build`
- [x] 12.8 Commit the verified slice with message `feat: add organization creation`

## 13. Organization Permissions and Tenant Isolation

- [x] 13.1 Define owner, admin, and member permission mappings as explicit application policy
- [x] 13.2 Implement organization membership and permission guards using current persisted membership state
- [x] 13.3 Require organization identifiers in organization-scoped repository contracts and queries
- [x] 13.4 Implement cursor-paginated membership listing
- [x] 13.5 Add unit tests covering every role-to-permission mapping and inactive membership
- [x] 13.6 Add integration and end-to-end tests proving unrelated and cross-tenant identifiers cannot expose data
- [x] 13.7 Run `npm run format:check`, `npm run lint`, `npm run typecheck`, architecture tests, affected tests, and `npm run build`
- [x] 13.8 Commit the verified slice with message `feat: enforce organization access control`

## 14. Membership Administration

- [x] 14.1 Implement supported non-owner membership role changes with permission enforcement
- [x] 14.2 Implement membership removal and immediate access loss
- [x] 14.3 Enforce the invariant that every organization retains an active owner
- [x] 14.4 Add role-change and membership-removal HTTP routes with stable errors
- [x] 14.5 Add unit and integration tests for valid changes, forbidden changes, stale roles, and last-owner protection
- [x] 14.6 Add end-to-end tests for administration success, HTTP 403 failures, and immediate authorization changes
- [x] 14.7 Run `npm run format:check`, `npm run lint`, `npm run typecheck`, affected tests, and `npm run build`
- [x] 14.8 Commit the verified slice with message `feat: add membership administration`

## 15. Audit Persistence and Recording

- [x] 15.1 Model immutable audit events with actor, organization, action, target, request identifier, safe metadata, and query indexes
- [x] 15.2 Generate and review the audit migration SQL
- [x] 15.3 Implement the audit append port and Prisma adapter with an explicit metadata allowlist
- [x] 15.4 Integrate audit appends into registration/session security and organization administration transactions where specified
- [x] 15.5 Add integration tests for atomic success/rollback, immutability, tenant ownership, and sensitive-data exclusion
- [x] 15.6 Run `npm run format:check`, `npm run lint`, `npm run typecheck`, affected unit/integration tests, and `npm run build`
- [x] 15.7 Commit the verified slice with message `feat: record immutable audit events`

## 16. Audit Retrieval

- [x] 16.1 Implement tenant-scoped cursor pagination and supported audit filters with deterministic ordering
- [x] 16.2 Enforce audit-read permission through application policy and HTTP guards
- [x] 16.3 Add the organization audit route and safe event response DTO
- [x] 16.4 Add unit and integration tests for pagination, filters, permission denial, and tenant isolation
- [x] 16.5 Add end-to-end tests for authorized retrieval and unauthorized concealment
- [x] 16.6 Run `npm run format:check`, `npm run lint`, `npm run typecheck`, affected tests, and `npm run build`
- [x] 16.7 Commit the verified slice with message `feat: add tenant audit queries`

## 17. OpenAPI and Scalar Reference

- [x] 17.1 Configure OpenAPI metadata, bearer authentication scheme, version information, tags, and raw document route
- [x] 17.2 Annotate public operations and DTOs with request, success, and standard Problem Details responses
- [x] 17.3 Mount Scalar API Reference with Fastify support against the generated OpenAPI route
- [x] 17.4 Add an OpenAPI generation test that validates required operations, schemas, and security declarations
- [x] 17.5 Add an end-to-end smoke test for the raw document and Scalar reference routes
- [x] 17.6 Run `npm run format:check`, `npm run lint`, `npm run typecheck`, OpenAPI tests, end-to-end tests, and `npm run build`
- [x] 17.7 Commit the verified slice with message `docs: add OpenAPI and Scalar reference`

## 18. Structured Logging and Correlation

- [x] 18.1 Add JSON logger configuration with service, environment, severity, timestamp, and error serialization
- [x] 18.2 Configure redaction for authorization, cookies, credentials, tokens, and secret fields
- [x] 18.3 Implement validated inbound or generated request identifiers and return them in response headers
- [x] 18.4 Add one request completion log with method, route template, status, duration, and request identifier
- [x] 18.5 Propagate request identifiers to audited application actions without coupling domain code to HTTP
- [x] 18.6 Add unit and end-to-end tests for correlation, bounded request logs, redaction, and error serialization
- [x] 18.7 Run `npm run format:check`, `npm run lint`, `npm run typecheck`, affected tests, and `npm run build`
- [x] 18.8 Commit the verified slice with message `feat: add structured correlated logging`

## 19. Health and Metrics

- [x] 19.1 Add a lightweight liveness endpoint independent of optional external dependencies
- [x] 19.2 Add a bounded-time readiness endpoint that verifies PostgreSQL and returns HTTP 503 when unavailable
- [x] 19.3 Add Prometheus-compatible process, request count, and request duration metrics
- [x] 19.4 Ensure metrics use route templates and exclude user, tenant, token, and request identifiers from labels
- [x] 19.5 Add unit and end-to-end tests for live, ready, not-ready, metric format, and label cardinality safeguards
- [x] 19.6 Run `npm run format:check`, `npm run lint`, `npm run typecheck`, affected tests, and `npm run build`
- [x] 19.7 Commit the verified slice with message `feat: add health checks and metrics`

## 20. Development Containers

- [x] 20.1 Add a pinned multi-stage Dockerfile with dependency, development, build, and production targets
- [x] 20.2 Add `.dockerignore` rules for local dependencies, environment files, logs, coverage, builds, generated clutter, and version-control internals
- [x] 20.3 Add Docker Compose API and PostgreSQL services with health-aware startup, named development storage, and localhost development ports
- [x] 20.4 Add container-specific environment examples and document ordinary versus destructive shutdown commands
- [x] 20.5 Build the development target and verify hot-start, PostgreSQL connectivity, liveness, and readiness
- [x] 20.6 Run `npm run format:check`, relevant host checks, and `docker compose config`
- [x] 20.7 Commit the verified slice with message `chore: add containerized development environment`

## 21. Production Container Hardening

- [x] 21.1 Run the production image as a dedicated non-root user with only runtime-required files
- [x] 21.2 Add container health check, termination behavior, and runtime-only secret configuration
- [x] 21.3 Build the production target from a clean context and inspect image user and copied artifacts
- [x] 21.4 Start the production target against PostgreSQL and run API, authentication, readiness, and graceful-shutdown smoke tests
- [x] 21.5 Run `npm run format:check`, `npm run lint`, `npm run typecheck`, all automated tests, `npm run build`, and the production container smoke test
- [x] 21.6 Commit the verified slice with message `chore: harden production container`

## 22. Final Quality Gate and Documentation

- [x] 22.1 Document architecture boundaries, feature anatomy, local setup, environment configuration, database workflows, tests, formatting, and API reference access
- [x] 22.2 Document extension recipes for a new module, use case, repository adapter, permission, audit action, and environment value
- [x] 22.3 Set representative coverage thresholds based on implemented modules and make the coverage command enforce them
- [x] 22.4 Run the complete workflow from a clean checkout, including dependency install, Prettier check, lint, typecheck, all test layers, migrations, build, and Compose smoke test
- [x] 22.5 Review generated OpenAPI output, container contents, logs, metrics labels, and repository files for leaked secrets or internal fields
- [x] 22.6 Commit the verified baseline with message `docs: finalize backend boilerplate`
