import { z } from 'zod'

const environmentNameSchema = z.enum(['development', 'test', 'production']).default('development')
const portSchema = z.coerce.number().int().min(1).max(65_535).default(3000)
const positiveIntegerSchema = z.coerce.number().int().positive()
const secretSchema = z.string().min(32, 'must contain at least 32 characters')
const pathSchema = z
  .string()
  .trim()
  .regex(/^\/[a-z0-9._/-]*$/i, 'must be an absolute URL path')
const booleanStringSchema = z
  .enum(['true', 'false'])
  .default('true')
  .transform((value) => value === 'true')
const corsOriginsSchema = z
  .string()
  .trim()
  .min(1)
  .default('http://localhost:3000')
  .transform((value) => value.split(',').map((origin) => origin.trim()))
  .pipe(z.array(z.string().url()).min(1))
const databaseUrlSchema = z
  .string()
  .url()
  .refine((value) => /^postgres(?:ql)?:\/\//i.test(value), {
    message: 'must use the postgres or postgresql protocol',
  })

const rawEnvironmentSchema = z
  .object({
    NODE_ENV: environmentNameSchema,
    HOST: z.string().trim().min(1).max(253).default('0.0.0.0'),
    PORT: portSchema,
    DATABASE_URL: databaseUrlSchema,
    AUTH_ACCESS_TOKEN_SECRET: secretSchema,
    AUTH_ACCESS_TOKEN_TTL_SECONDS: positiveIntegerSchema.default(900),
    AUTH_REFRESH_TOKEN_HASH_SECRET: secretSchema,
    AUTH_REFRESH_TOKEN_TTL_SECONDS: positiveIntegerSchema.default(2_592_000),
    CORS_ORIGINS: corsOriginsSchema,
    RATE_LIMIT_MAX: positiveIntegerSchema.default(100),
    RATE_LIMIT_WINDOW_SECONDS: positiveIntegerSchema.default(60),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
    DOCS_ENABLED: booleanStringSchema,
    DOCS_OPENAPI_PATH: pathSchema.default('/openapi.json'),
    DOCS_REFERENCE_PATH: pathSchema.default('/reference'),
  })
  .strip()

export const environmentSchema = rawEnvironmentSchema.transform((environment) =>
  Object.freeze({
    application: Object.freeze({
      environment: environment.NODE_ENV,
      host: environment.HOST,
      port: environment.PORT,
    }),
    database: Object.freeze({
      url: environment.DATABASE_URL,
    }),
    authentication: Object.freeze({
      accessTokenSecret: environment.AUTH_ACCESS_TOKEN_SECRET,
      accessTokenTtlSeconds: environment.AUTH_ACCESS_TOKEN_TTL_SECONDS,
      refreshTokenHashSecret: environment.AUTH_REFRESH_TOKEN_HASH_SECRET,
      refreshTokenTtlSeconds: environment.AUTH_REFRESH_TOKEN_TTL_SECONDS,
    }),
    cors: Object.freeze({
      origins: Object.freeze(environment.CORS_ORIGINS),
    }),
    rateLimit: Object.freeze({
      max: environment.RATE_LIMIT_MAX,
      windowSeconds: environment.RATE_LIMIT_WINDOW_SECONDS,
    }),
    logging: Object.freeze({
      level: environment.LOG_LEVEL,
    }),
    documentation: Object.freeze({
      enabled: environment.DOCS_ENABLED,
      openApiPath: environment.DOCS_OPENAPI_PATH,
      referencePath: environment.DOCS_REFERENCE_PATH,
    }),
  }),
)

export type EnvironmentInput = z.input<typeof environmentSchema>
export type ApplicationConfig = z.output<typeof environmentSchema>
