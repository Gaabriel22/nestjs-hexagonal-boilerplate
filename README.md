# NestJS Hexagonal Boilerplate

Production-oriented backend baseline for teams that want to begin with explicit architecture,
secure identity, tenant isolation, observability, automated quality gates, and reproducible
containers already in place.

This repository is intentionally a **modular monolith**. It protects business rules with pragmatic
Hexagonal Architecture and tactical DDD without introducing microservices, brokers, event sourcing,
or framework abstractions before the product needs them.

![NestJS Hexagonal Boilerplate architecture](docs/images/architecture.png)

> [!NOTE]
> The illustration reads from the protected center outward: pure domain rules, application use
> cases and ports, then HTTP, persistence, security, containers, and observability adapters.
> Dependencies point inward even though requests and data flow in both directions.

## What is included

- Credential registration and login with normalized email addresses and Argon2id password hashes
- Short-lived JWT access tokens and opaque, rotating refresh tokens with reuse detection
- Current-user profile reads and updates without exposing persistence or credential fields
- Organizations, memberships, explicit permissions, and defense-in-depth tenant isolation
- Immutable audit events written atomically with security-sensitive business changes
- Versioned Fastify API, strict DTO validation, RFC 9457-style Problem Details, OpenAPI, and Scalar
- Structured JSON logs, request correlation, secret redaction, health probes, and Prometheus metrics
- Unit, integration, architecture, end-to-end, and enforced coverage suites
- Pinned development and hardened non-root production containers

## Why this stack

The stack is chosen as a set of complementary boundaries, not as a dependency checklist.

| Choice                                | Why it is here                                                                                                                                        | Deliberate trade-off                                                                           |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Node.js 24 + TypeScript**           | A current server runtime and strict types give the project one language from HTTP contracts to domain rules.                                          | Runtime validation is still required because TypeScript types disappear at process boundaries. |
| **NestJS 11**                         | Modules, dependency injection, guards, and lifecycle hooks provide a predictable composition root for a growing backend.                              | Nest stays outside the domain so decorators and DI do not become the business model.           |
| **Fastify**                           | Lower HTTP overhead and a schema-friendly plugin ecosystem make it a focused production adapter.                                                      | Express-only middleware is intentionally unsupported.                                          |
| **Prisma 7 + PostgreSQL 18**          | Prisma provides typed persistence and reviewable migrations while PostgreSQL supplies the transactions, constraints, and indexing the workflows need. | Tests use PostgreSQL too; SQLite would be faster but would hide production-specific behavior.  |
| **Zod + class-validator**             | Zod validates process configuration once at startup; DTO decorators validate transport input at the HTTP edge.                                        | Two validators are used because their boundaries and consumers are different.                  |
| **Argon2id + rotated refresh tokens** | Passwords use a memory-hard hash, while server-side session state enables targeted revocation and token-reuse detection.                              | This is more operationally involved than completely stateless authentication.                  |
| **OpenAPI + Scalar**                  | The contract is generated from the running application and rendered as an interactive reference, reducing drift.                                      | DTOs and controllers must keep their documentation metadata accurate.                          |
| **Pino + prom-client**                | Structured logs and bounded Prometheus metrics expose useful signals without prescribing a hosted monitoring vendor.                                  | Dashboards and collectors remain deployment concerns.                                          |
| **Jest + architecture tests**         | Different suites localize failures, and import rules continuously enforce the dependency direction described here.                                    | The test matrix is broader than a CRUD starter, by design.                                     |
| **Prettier + ESLint**                 | Prettier owns deterministic formatting; ESLint owns code quality. Their responsibilities do not overlap.                                              | Formatting choices are intentionally not project debates.                                      |
| **Docker multi-stage builds**         | Development is reproducible and the production image contains only runtime artifacts under a non-root user.                                           | Native host development remains supported for faster inner loops.                              |

The lockfile and container tags pin the exact tested combination. Dependency ranges permit
compatible updates, but upgrades should be accepted only after the complete quality workflow passes.

## Architecture

### Dependency rule

Each business capability owns its code. The allowed direction is:

```text
infrastructure  -->  application  -->  domain
      Nest              use cases       pure TypeScript
      Fastify           ports           entities and policies
      Prisma            result types    value objects and errors
```

- `domain` knows nothing about NestJS, Fastify, Prisma, HTTP, or environment variables.
- `application` coordinates use cases and depends on small ports, never concrete adapters.
- `infrastructure` translates HTTP and persistence concerns and wires implementations in Nest modules.
- Cross-feature collaboration uses exported application services or explicit ports, not another
  feature's Prisma repository.
- `shared` is restricted to genuine cross-cutting primitives and infrastructure. It is not a place
  for miscellaneous business logic.

Architecture tests scan imports and fail when these rules are violated. The boundary is executable,
not merely documented.

### Feature anatomy

```text
src/
|-- identity/
|   |-- domain/          # identity entities, value objects, policies, repository contracts
|   |-- application/     # registration, login, refresh, logout, sessions, outbound ports
|   |-- infrastructure/  # HTTP controller, guards, Prisma and cryptography adapters
|   `-- identity.module.ts
|-- users/               # current-user profile capability
|-- organizations/       # organizations, memberships, roles, permissions, tenant guards
|-- audit/               # immutable events and tenant-scoped audit queries
|-- operations/          # liveness, readiness, metrics
|-- shared/              # configuration, database, HTTP conventions, logging, system adapters
|-- app.module.ts        # composition root
|-- bootstrap.ts         # framework setup
`-- main.ts              # process entry point
```

This feature-first shape keeps everything needed to understand a capability close together. The
internal layers are used where they protect a meaningful boundary; simple projections do not need
ceremony purely to resemble textbook DDD.

### Request lifecycle

1. Fastify receives the request and validates or creates `x-request-id`.
2. Nest routes a versioned endpoint and validates its DTO, rejecting unknown fields.
3. Guards load current user, session, and membership state instead of trusting stale token claims.
4. The controller passes normalized input to an application use case.
5. The use case executes domain rules through ports implemented by infrastructure adapters.
6. Transactional workflows persist both the business change and its immutable audit event.
7. A safe response DTO or Problem Details document crosses the HTTP boundary.
8. One bounded completion log and low-cardinality metrics record the outcome.

## Security model

- Plain-text passwords and refresh tokens are never persisted.
- Unknown-user and wrong-password login attempts receive the same public failure.
- Refresh tokens rotate atomically; reuse revokes the affected session or token family.
- Access tokens contain stable user and session identifiers, not roles or sensitive profile data.
- Protected requests reload active user, session, and membership state for immediate revocation.
- Tenant access is checked by both permission guards and organization-scoped repository queries.
- Audit metadata is action-specific and allowlisted; request bodies, credentials, cookies, and tokens
  are excluded.
- Logs redact authorization, cookie, credential, token, and secret fields before serialization.
- Production runs as the non-root `node` user with a read-only filesystem-compatible runtime.
- Configuration is parsed once and invalid startup values fail before the API accepts traffic.

These defaults reduce common failure modes, but they do not replace deployment controls such as TLS,
a managed secret store, network policy, database backups, or an external rate-limiting strategy.

## API surface

Business endpoints are under `/api/v1`. Operational endpoints are deliberately version-neutral.

| Method   | Route                                                                  | Purpose                                                |
| -------- | ---------------------------------------------------------------------- | ------------------------------------------------------ |
| `POST`   | `/api/v1/auth/register`                                                | Register an active user and credential                 |
| `POST`   | `/api/v1/auth/login`                                                   | Create a renewable authenticated session               |
| `POST`   | `/api/v1/auth/refresh`                                                 | Atomically rotate the refresh token                    |
| `POST`   | `/api/v1/auth/logout`                                                  | Revoke the current session                             |
| `GET`    | `/api/v1/auth/sessions`                                                | List the current user's active sessions                |
| `DELETE` | `/api/v1/auth/sessions/:sessionId`                                     | Revoke an owned session                                |
| `GET`    | `/api/v1/users/me`                                                     | Retrieve the safe current-user profile                 |
| `PATCH`  | `/api/v1/users/me`                                                     | Update supported profile fields                        |
| `POST`   | `/api/v1/organizations`                                                | Create an organization and owner membership atomically |
| `GET`    | `/api/v1/organizations/:organizationId/memberships`                    | List tenant memberships with cursor pagination         |
| `PATCH`  | `/api/v1/organizations/:organizationId/memberships/:membershipId/role` | Change a supported non-owner role                      |
| `DELETE` | `/api/v1/organizations/:organizationId/memberships/:membershipId`      | Remove an eligible membership                          |
| `GET`    | `/api/v1/organizations/:organizationId/audit-events`                   | Query tenant audit events with permission checks       |
| `GET`    | `/api/health/live`                                                     | Report process liveness without external dependencies  |
| `GET`    | `/api/health/ready`                                                    | Verify required PostgreSQL connectivity                |
| `GET`    | `/api/metrics`                                                         | Expose Prometheus-compatible process and HTTP metrics  |

The generated OpenAPI document is the detailed source of truth for bodies, responses, authentication,
filters, pagination, and Problem Details schemas.

## Quick start with Docker

Requirements: Docker Desktop with virtualization enabled.

```powershell
Copy-Item .env.docker.example .env.docker
docker compose --env-file .env.docker up --build --wait
```

This is the shortest path because Compose creates the private network, waits for PostgreSQL health,
applies migrations, starts the watch server, and publishes only localhost development ports.

- API: `http://localhost:3000`
- Scalar API Reference: `http://localhost:3000/reference`
- OpenAPI JSON: `http://localhost:3000/openapi.json`
- PostgreSQL: `localhost:5432`

Stop the stack while preserving the named PostgreSQL volume:

```powershell
docker compose --env-file .env.docker down
```

Delete the development database only when that data is intentionally disposable:

```powershell
docker compose --env-file .env.docker down --volumes
```

> [!WARNING]
> `--volumes` permanently removes the Compose development database. Ordinary `down` preserves it.

## Native development

Requirements:

- Node.js 24 or newer
- npm 12 or newer
- PostgreSQL reachable by `DATABASE_URL`

```powershell
Copy-Item .env.example .env
npm ci
npm run db:generate
npm run db:migrate:deploy
npm run dev
```

`npm ci` is preferred for reproducibility because it installs exactly what `package-lock.json`
records. `prisma generate` produces the local client, migrations establish the database contract,
and the watch server then starts with validated configuration.

## Environment configuration

Copy the example that matches the runtime and replace its placeholders:

- `.env.example` for native development and test tooling
- `.env.docker.example` for Docker Compose development
- `.env.production.example` for production runtime injection

| Variable                         | Required/default                 | Why it exists                                                          |
| -------------------------------- | -------------------------------- | ---------------------------------------------------------------------- |
| `NODE_ENV`                       | `development`                    | Selects environment-aware logging and runtime behavior                 |
| `HOST`                           | `0.0.0.0`                        | Allows containers and host processes to choose the listening interface |
| `PORT`                           | `3000`                           | Selects the application port                                           |
| `DATABASE_URL`                   | required                         | PostgreSQL connection used by Prisma and readiness                     |
| `TEST_DATABASE_URL`              | required for DB tests            | Isolates destructive test resets from development and production data  |
| `AUTH_ACCESS_TOKEN_SECRET`       | required, at least 32 characters | Signs short-lived access tokens                                        |
| `AUTH_ACCESS_TOKEN_TTL_SECONDS`  | `900`                            | Bounds access-token exposure                                           |
| `AUTH_REFRESH_TOKEN_HASH_SECRET` | required, at least 32 characters | Keys persisted refresh-token hashes                                    |
| `AUTH_REFRESH_TOKEN_TTL_SECONDS` | `2592000`                        | Sets the renewable session lifetime                                    |
| `CORS_ORIGINS`                   | `http://localhost:3000`          | Comma-separated browser origins allowed by Fastify CORS                |
| `HTTP_BODY_LIMIT_BYTES`          | `1048576`                        | Rejects unexpectedly large bodies before application handling          |
| `RATE_LIMIT_MAX`                 | `100`                            | Bounds requests inside the configured window                           |
| `RATE_LIMIT_WINDOW_SECONDS`      | `60`                             | Defines the rate-limit window                                          |
| `LOG_LEVEL`                      | `info`                           | Controls structured log verbosity                                      |
| `DOCS_ENABLED`                   | `true`                           | Allows documentation to be disabled in production                      |
| `DOCS_OPENAPI_PATH`              | `/openapi.json`                  | Configures the raw contract route                                      |
| `DOCS_REFERENCE_PATH`            | `/reference`                     | Configures the Scalar route                                            |

Real secrets belong in the deployment platform's secret manager or an ignored runtime file. They
must never be committed, copied into an image layer, or passed as Docker build arguments.

## Database workflows

```powershell
npm run db:generate
npm run db:migrate:dev
npm run db:migrate:deploy
```

- `db:generate` regenerates the typed Prisma client after schema changes.
- `db:migrate:dev` creates and applies a migration during local schema development. Review the SQL
  before committing it.
- `db:migrate:deploy` applies already committed migrations without trying to infer schema changes;
  use this in deployed environments.

Integration and E2E preparation intentionally reset only a database whose name ends in `_test` or
`_testing`. The guard also rejects PostgreSQL system databases and a URL equal to `DATABASE_URL`.

When using the Compose PostgreSQL instance for host tests, create the isolated database once:

```powershell
docker compose --env-file .env.docker up --detach --wait postgres
docker compose --env-file .env.docker exec postgres createdb -U app app_test
$env:TEST_DATABASE_URL = 'postgresql://app:app@localhost:5432/app_test?schema=public'
```

## Tests and quality gates

```powershell
npm run format:check
npm run lint
npm run typecheck
npm run test:unit
npm run test:architecture
npm run test:integration
npm run test:e2e
npm run test:coverage
npm run build
```

| Suite        | What it proves                                                                                       | Why it is separate                                       |
| ------------ | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Unit         | Domain rules, policies, and use-case orchestration with deterministic fakes                          | Fast feedback without network or database                |
| Architecture | Domain/application import boundaries                                                                 | Prevents gradual framework and persistence coupling      |
| Integration  | Prisma mappings, constraints, transactions, repositories, and migrations                             | Exercises real PostgreSQL behavior                       |
| E2E          | HTTP validation, authentication, authorization, tenant isolation, errors, logs, docs, and operations | Proves the assembled Nest/Fastify application            |
| Coverage     | Unit coverage of `domain` and `application`                                                          | Measures the code intended to stay framework-independent |

Coverage is enforced globally over the business core at **90% statements**, **90% branches**,
**80% functions**, and **90% lines**. Infrastructure is not ignored: it is verified by integration
and E2E behavior instead of being rewarded for shallow line execution.

Use `npm run format` to rewrite supported files. Use the non-mutating `format:check` in pre-commit
and CI workflows. ESLint does not duplicate Prettier's formatting responsibility.

## API reference

With `DOCS_ENABLED=true`, open Scalar at `/reference` or consume `/openapi.json`. Both routes are
non-versioned because the document describes every supported API version. Scalar loads the same
generated document tested by the E2E suite, so there is no second handwritten contract to drift.

Production examples disable documentation by default. If it is enabled outside development,
protect access at the network or gateway layer according to the deployment's exposure model.

## Observability

- Every request accepts a bounded client `x-request-id` or receives a generated UUID.
- The same identifier is returned in the response, included in the completion log, and propagated to
  audit events created by that request.
- Completion logs contain method, route template, status, and duration. Route templates avoid
  cardinality explosions from user or tenant identifiers.
- `/api/health/live` answers without depending on PostgreSQL; orchestrators can distinguish a dead
  process from a temporarily unavailable dependency.
- `/api/health/ready` checks PostgreSQL with bounded time and returns `503` when traffic should stop.
- `/api/metrics` exposes process metrics and HTTP counts/durations without user, tenant, token, or
  request identifiers as labels.

The repository exposes signals but deliberately does not bundle Prometheus, Grafana, or a log
collector. Operations platforms differ by deployment and should consume these stable interfaces.

## Extending the boilerplate

### Add a business module

1. Create `src/<feature>/` and add only the layers the capability needs.
2. Put pure business vocabulary and invariants in `domain`.
3. Put orchestration, input/result types, and outbound ports in `application`.
4. Put controllers, guards, Prisma adapters, and framework composition in `infrastructure`.
5. Wire providers and exported application services in `<feature>.module.ts`.
6. Import that module from `AppModule` and add an architecture test case if a new boundary appears.

Do not begin with a generic CRUD base class. Repetition is cheaper than the wrong abstraction, and a
real shared pattern can be extracted after multiple features prove it exists.

### Add a use case

1. Name the application service after an outcome, such as `ApproveMembership`, not a transport verb.
2. Accept a transport-agnostic command and return an application-owned result.
3. Depend on domain objects and small ports through the constructor.
4. Keep transaction requirements explicit in the repository port when several writes must be atomic.
5. Unit test success, rule failures, and orchestration before exposing the use case over HTTP.
6. Add a controller method that only maps DTO input and safe output.

### Add a repository adapter

1. Define the smallest required port in `application/ports` or a domain repository contract when it
   represents aggregate persistence.
2. Implement it under `infrastructure/persistence` with Prisma.
3. Map Prisma records at the adapter boundary; do not return generated Prisma types inward.
4. Require `organizationId` in every tenant-owned query and mutation, even when a guard already ran.
5. Bind the port token to the adapter in the feature module.
6. Add PostgreSQL integration tests for mapping, constraints, transaction rollback, and tenant scope.

### Add a permission

1. Add the permission constant to `ORGANIZATION_PERMISSIONS`.
2. Decide explicitly which role sets receive it in `ROLE_PERMISSIONS`.
3. Declare it on the route with `RequireOrganizationPermission`.
4. Keep repository queries tenant-scoped as a second boundary.
5. Extend the role matrix unit tests and add E2E denial for an insufficient role.

### Add an audit action

1. Add the action and, if necessary, target type to the constants in `audit-event.ts`.
2. Add only safe metadata keys to that action's `METADATA_ALLOWLIST`.
3. Create the event in the application workflow with actor, target, timestamp, and request identifier.
4. Persist it in the same database transaction as the business change.
5. Test commit, rollback, tenant ownership, request correlation, and sensitive-data exclusion.

Never place passwords, hashes, tokens, authorization headers, cookies, or unrestricted request bodies
in audit metadata. The allowlist is a security boundary, not a convenience mapper.

### Add an environment value

1. Add its parser, default, and safety constraints to `environment.schema.ts`.
2. Map it into the immutable `ApplicationConfig` shape.
3. Consume the typed configuration through `ConfigService`, not `process.env` in feature code.
4. Add valid, missing, and malformed cases to the configuration unit tests.
5. Add a non-secret example to every relevant `.env*.example` file.
6. Document its purpose and production implications in the environment table above.

## Production container

Build the hardened runtime target:

```powershell
docker build --target production --tag nestjs-hexagonal-boilerplate:production .
```

Copy `.env.production.example` to an ignored `.env.production`, replace every placeholder, and inject
it only when the container starts:

```powershell
docker run --rm --init --read-only --tmpfs /tmp --env-file .env.production --publish 127.0.0.1:3000:3000 nestjs-hexagonal-boilerplate:production
```

The final stage runs as UID/GID 1000 (`node`) and copies only `package.json`, pruned production
dependencies, and compiled `dist`. It declares `SIGTERM` for graceful Nest shutdown and uses the
liveness endpoint for its image healthcheck. Schema migrations remain a deployment step instead of
being hidden inside application startup.

## Deliberate non-goals

The baseline does not include social login, password recovery, email verification, MFA, invitations,
billing, custom roles, a queue, microservices, CQRS infrastructure, event sourcing, row-level
security, or a hosted observability stack. These are product and deployment choices. Adding them
before requirements exist would make the boilerplate harder to understand and remove safely.

The intended extension path is a well-tested modular monolith. Extract a service only when ownership,
scaling, deployment cadence, or fault isolation provides concrete evidence for the boundary.
