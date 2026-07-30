## Context

The repository contains an OpenSpec workspace but no application implementation. The change establishes a reusable backend baseline with NestJS, the Fastify adapter, TypeScript, Prisma ORM, PostgreSQL, Docker, and Scalar API Reference.

The system is a modular monolith. It must be useful as a starting point without pretending every CRUD concern needs a rich domain model. Architectural boundaries exist to protect business rules and tests, while feature modules remain small and can evolve independently.

## Goals / Non-Goals

**Goals:**

- Produce a runnable, secure-by-default backend with repeatable local setup.
- Organize code by business capability and enforce inward dependency direction.
- Keep domain and application behavior testable without HTTP or PostgreSQL.
- Supply realistic identity, session, user, organization, permission, and audit foundations.
- Standardize API contracts, configuration, errors, documentation, observability, and tests.
- Allow every implementation slice to end with a focused verification and commit checkpoint.

**Non-Goals:**

- Microservices, event sourcing, CQRS infrastructure, message brokers, or distributed transactions.
- Social login, password recovery, email verification, MFA, invitations, billing, or custom role administration.
- A production orchestration platform, hosted monitoring stack, or cloud-specific deployment.
- A generic framework hidden behind speculative abstractions.
- Business features unrelated to platform identity and tenant administration.

## Decisions

### 1. Use a feature-first modular monolith with three internal layers

Top-level application code is organized into `shared`, `identity`, `users`, `organizations`, and `audit` Nest modules. Each business module may contain `domain`, `application`, and `infrastructure` folders:

- `domain`: pure TypeScript entities, value objects, policies, errors, and repository contracts.
- `application`: use cases, commands/queries, result types, and outbound ports.
- `infrastructure`: Nest controllers, guards, Prisma repositories, mappers, and module composition.

Dependencies point from infrastructure to application to domain. Cross-module access uses exported application services or explicit ports, never another module's Prisma repository.

Alternative considered: global folders named `controllers`, `services`, and `repositories`. Rejected because capabilities become coupled as the project grows.

Alternative considered: full CQRS and event sourcing. Rejected because current workflows do not justify their operational and cognitive cost.

### 2. Keep NestJS and Prisma outside the domain

Nest decorators, HTTP types, Prisma generated types, and persistence records stay in infrastructure. Application code depends on small TypeScript contracts identified by Nest injection tokens at the composition boundary. Prisma repositories map persistence records to domain objects where behavior exists; simple read projections may return application-owned result types directly.

Alternative considered: expose Prisma models throughout services. Rejected because it couples use cases and business rules to schema and ORM changes.

### 3. Use Fastify as the only HTTP adapter

Bootstrap creates a `NestFastifyApplication`, listens on a configurable host and port, and supports graceful shutdown. Fastify-compatible plugins provide security headers, CORS, cookies when required, and rate limiting. Express-only middleware is prohibited.

Alternative considered: support Express and Fastify simultaneously. Rejected because dual-adapter compatibility adds testing and dependency cost without a stated need.

### 4. Validate configuration and HTTP input at boundaries

Environment configuration is parsed once during startup into typed immutable configuration. Missing or invalid required values fail startup with actionable errors. A global validation pipe rejects unknown properties and transforms only declared values. Response DTOs prevent password hashes, session token hashes, and internal fields from being serialized.

Alternative considered: access `process.env` throughout modules. Rejected because behavior becomes implicit and hard to test.

### 5. Standardize errors with Problem Details

Domain and application errors remain transport-agnostic. A global exception filter maps known errors to stable machine-readable codes and RFC 9457-style Problem Details responses. Unexpected errors return a generic message while full diagnostics remain in structured logs. Validation errors include safe field-level details.

Alternative considered: throw Nest HTTP exceptions from use cases. Rejected because it leaks the HTTP adapter inward.

### 6. Generate OpenAPI once and serve it through Scalar

Nest OpenAPI metadata produces the canonical document. The raw document and Scalar reference are served from configurable, non-versioned documentation routes. Scalar uses its Fastify-compatible integration. Authentication schemes, error envelopes, and operation response types are described in the document.

Alternative considered: maintain a separate handwritten OpenAPI file. Rejected because implementation and contract would drift.

### 7. Use short-lived access tokens and rotated opaque refresh tokens

Passwords are hashed with Argon2id. Authentication returns a short-lived signed access token plus an opaque refresh token. Only a keyed hash of the refresh token is persisted in a session row. Refresh rotates the token atomically and rejects reuse; logout revokes the current session; users can list and revoke their other sessions. Token secrets and lifetimes come from validated configuration.

Access tokens carry only stable identity and session identifiers. Current user and membership state is loaded for protected operations so disabled users, revoked sessions, and changed permissions take effect without waiting for long token expiry.

Alternative considered: long-lived stateless JWT refresh tokens. Rejected because targeted revocation and reuse detection are weak.

### 8. Model tenant access through explicit memberships

Users and organizations are separate aggregates connected by memberships. Initial roles are `owner`, `admin`, and `member`, mapped to explicit permission constants in application policy code. The creator becomes owner in the same transaction as organization creation.

Tenant routes include an organization identifier. Guards resolve active membership and required permissions; repositories also require tenant identifiers for tenant-owned access. This defense in depth prevents accidental cross-tenant reads.

Alternative considered: PostgreSQL row-level security in the first version. Rejected because Prisma integration and request context add complexity. RLS remains a future hardening option.

### 9. Write audit events in the business transaction

Security-sensitive and administrative use cases append immutable audit records with actor, organization when applicable, action, target type/id, timestamp, request correlation identifier, and safe metadata. Secrets, credentials, tokens, and full request bodies are never recorded. Audit reads are cursor-paginated and permission protected.

Alternative considered: infer audit history from application logs. Rejected because logs are operational records and do not provide a stable product query model.

### 10. Use PostgreSQL and Prisma migrations as the persistence contract

The initial schema covers users, credentials, sessions, organizations, memberships, and audit events. IDs are application-generated UUIDs; timestamps use timezone-aware PostgreSQL values; email uniqueness is enforced on a normalized form; foreign keys and common lookup paths receive indexes. Transactions cover organization creation, token rotation, and use cases that must persist audit data atomically.

Alternative considered: SQLite for automated integration tests. Rejected because behavior differs from PostgreSQL. Integration and end-to-end tests use an isolated PostgreSQL database.

### 11. Use layered tests and architecture checks

- Unit tests cover domain behavior, policies, and use cases with fakes.
- Integration tests cover Prisma repositories and migrations against isolated PostgreSQL.
- HTTP end-to-end tests use Nest/Fastify injection against the complete application.
- Architecture tests scan imports to prevent domain/application dependency violations.

Tests are order-independent, control time and identifiers through ports where relevant, and never call real external services. Each task group names its verification command before a commit checkpoint.

Alternative considered: rely only on end-to-end tests. Rejected because failures would be slower and harder to localize.

### 12. Make Prettier the canonical formatter

Prettier owns deterministic formatting for supported source, test, configuration, and documentation files. The repository provides one committed configuration, a focused ignore file for generated and build artifacts, `format` for local writes, and `format:check` for non-mutating CI verification. ESLint owns code-quality rules and does not duplicate stylistic formatting rules.

Alternative considered: rely on editor-specific formatting or ESLint formatting rules. Rejected because results would vary by contributor and responsibilities would overlap.

### 13. Separate development and production container concerns

A multi-stage Dockerfile provides dependency, development, build, and non-root runtime stages. Docker Compose runs API and PostgreSQL with health checks and persistent development data. Images and runtime versions are pinned; secrets remain runtime environment values; the production stage contains only required artifacts.

Alternative considered: one development-only image. Rejected because it cannot validate production build and runtime behavior.

### 14. Establish baseline observability without a hosted stack

The API emits JSON logs with timestamp, level, service, environment, request identifier, route template, status, and duration. Sensitive headers and fields are redacted. Liveness reports process health; readiness verifies required dependencies. Prometheus-compatible metrics expose low-cardinality request and process measurements.

Alternative considered: bundle Prometheus and Grafana into the default stack. Rejected because the boilerplate should expose signals without imposing an operations platform.

## Risks / Trade-offs

- [Architecture ceremony exceeds simple feature needs] → Require layers only at meaningful boundaries and allow direct application projections for simple reads.
- [Role model is too limited for some products] → Keep permission checks explicit so custom roles can replace the initial role mapping later.
- [Application tenant filters can be omitted] → Require organization identifiers in tenant repository contracts and cover cross-tenant denial with integration tests.
- [Refresh token races create duplicate valid sessions] → Rotate inside a transaction with a conditional update and revoke the token family on detected reuse.
- [Audit writes add latency and storage] → Store compact metadata, index supported queries, and avoid synchronous external exports.
- [Metrics labels cause cardinality growth] → Use route templates and bounded labels; never use user, tenant, or request IDs as labels.
- [Containers hide host-specific development issues] → Keep documented npm commands usable both inside and outside Docker.
- [Large initial scope delays feedback] → Implement vertical slices with tests and commit checkpoints; foundation work must not prebuild unused abstractions.

## Migration Plan

1. Scaffold tooling and verify lint, typecheck, unit test, and production build commands.
2. Add runtime bootstrap, configuration, HTTP conventions, and architecture checks.
3. Add PostgreSQL/Prisma infrastructure and validate migrations in an isolated database.
4. Deliver identity, users, organizations/access control, and audit as separate tested slices.
5. Add OpenAPI/Scalar, observability, container hardening, and full end-to-end checks.
6. Tag the resulting repository state as the initial boilerplate baseline.

Every implementation checkpoint runs Prettier verification together with the slice-specific checks before commit.

Rollback during development is commit-based: each slice is independently revertible before later slices depend on it. For a deployed database, additive migrations roll forward; destructive rollback migrations are not generated automatically.

## Open Questions

- Choose supported Node.js and PostgreSQL major versions when implementation starts, then pin them consistently in engines, CI, and containers.
- Decide whether refresh tokens are returned in a secure HTTP-only cookie or response body based on the first consumer type; all other session behavior remains unchanged.
- Decide the initial global coverage thresholds after the first representative modules exist, avoiding a meaningless threshold on scaffold-only code.
