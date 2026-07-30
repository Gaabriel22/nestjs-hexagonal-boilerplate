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
