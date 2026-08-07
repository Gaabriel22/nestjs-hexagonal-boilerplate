# syntax=docker/dockerfile:1.7

ARG NODE_IMAGE=node:24.18.0-bookworm-slim

FROM ${NODE_IMAGE} AS base

ENV NPM_CONFIG_FUND=false \
    NPM_CONFIG_UPDATE_NOTIFIER=false

WORKDIR /app

RUN apt-get update \
    && apt-get install --yes --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

RUN npm install --global npm@12.0.2

FROM base AS dependencies

COPY package.json package-lock.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma

RUN npm ci

FROM dependencies AS development

ENV NODE_ENV=development

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]

FROM dependencies AS build

COPY . .

RUN npm run build
RUN npm prune --omit=dev --ignore-scripts

FROM base AS production

ENV NODE_ENV=production

COPY --from=build --chown=node:node /app/package.json ./
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist

USER node

EXPOSE 3000

STOPSIGNAL SIGTERM

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/health/live').then(response => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"]

CMD ["node", "dist/main.js"]
