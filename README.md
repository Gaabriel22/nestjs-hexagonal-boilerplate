# NestJS Hexagonal Boilerplate

Production-oriented NestJS backend boilerplate using Fastify and TypeScript.

## Requirements

- Node.js 24 or newer
- npm 12 or newer

## Development

Install dependencies and run the application:

```bash
npm install
npm run dev
```

## Quality commands

Prettier is the canonical formatter. Its committed configuration applies equally in every editor
and in automation.

```bash
npm run format
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
```

`format` rewrites supported files. `format:check` is non-mutating and intended for local
pre-commit checks and CI.

## Environment

Copy `.env.example` to `.env` for local development. Startup validates the full environment before
the API accepts traffic; missing or malformed required values stop the process with redacted
diagnostics.

Required values:

- `DATABASE_URL`
- `AUTH_ACCESS_TOKEN_SECRET`
- `AUTH_REFRESH_TOKEN_HASH_SECRET`

The committed example contains development-only placeholders. Replace every secret outside local
development.

## Docker development

Copy the container environment example, then start the API and PostgreSQL:

```powershell
Copy-Item .env.docker.example .env.docker
docker compose --env-file .env.docker up --build
```

The API is available at `http://localhost:3000`, Scalar at
`http://localhost:3000/reference`, and PostgreSQL at `localhost:5432`. Source changes restart the
Nest development server. Database migrations run before the API starts.

Stop containers while preserving PostgreSQL data:

```powershell
docker compose --env-file .env.docker down
```

Remove containers and permanently delete the development database volume:

```powershell
docker compose --env-file .env.docker down --volumes
```
