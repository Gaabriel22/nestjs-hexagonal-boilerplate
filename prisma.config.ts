import 'dotenv/config'

import { defineConfig } from 'prisma/config'

const generationDatabaseUrl =
  process.env.DATABASE_URL ?? 'postgresql://prisma:prisma@localhost:5432/prisma_generation'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: generationDatabaseUrl,
  },
})
