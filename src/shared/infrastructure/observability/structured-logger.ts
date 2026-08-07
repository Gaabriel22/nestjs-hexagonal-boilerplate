import type { LoggerService, LogLevel } from '@nestjs/common'
import pino, { type DestinationStream, type Logger } from 'pino'

import type { ApplicationConfig } from '../config/environment.schema'

export const REDACTION_MARKER = '[Redacted]'

const SENSITIVE_LOG_PATHS = [
  'authorization',
  'cookie',
  'password',
  'passwordHash',
  'credentials',
  'accessToken',
  'refreshToken',
  'token',
  'secret',
  '*.authorization',
  '*.cookie',
  '*.password',
  '*.passwordHash',
  '*.credentials',
  '*.accessToken',
  '*.refreshToken',
  '*.token',
  '*.secret',
  '*.*.authorization',
  '*.*.cookie',
  '*.*.password',
  '*.*.passwordHash',
  '*.*.credentials',
  '*.*.accessToken',
  '*.*.refreshToken',
  '*.*.token',
  '*.*.secret',
  'req.headers.authorization',
  'req.headers.cookie',
  'req.body.password',
  'req.body.accessToken',
  'req.body.refreshToken',
] as const

function messageText(message: unknown): string {
  if (message instanceof Error) {
    return message.message
  }

  return typeof message === 'string' ? message : 'Application log event'
}

export class StructuredLogger implements LoggerService {
  constructor(private readonly logger: Logger) {}

  log(message: unknown, ...optionalParams: unknown[]): void {
    this.write('info', message, optionalParams)
  }

  fatal(message: unknown, ...optionalParams: unknown[]): void {
    this.write('fatal', message, optionalParams)
  }

  error(message: unknown, ...optionalParams: unknown[]): void {
    this.write('error', message, optionalParams)
  }

  warn(message: unknown, ...optionalParams: unknown[]): void {
    this.write('warn', message, optionalParams)
  }

  debug(message: unknown, ...optionalParams: unknown[]): void {
    this.write('debug', message, optionalParams)
  }

  verbose(message: unknown, ...optionalParams: unknown[]): void {
    this.write('trace', message, optionalParams)
  }

  setLogLevels(levels: LogLevel[]): void {
    const firstLevel = levels[0]

    if (firstLevel !== undefined) {
      this.logger.level =
        firstLevel === 'log' ? 'info' : firstLevel === 'verbose' ? 'trace' : firstLevel
    }
  }

  private write(
    level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal',
    message: unknown,
    optionalParams: readonly unknown[],
  ): void {
    const contextCandidate = optionalParams.at(-1)
    const context = typeof contextCandidate === 'string' ? contextCandidate : undefined
    const traceCandidate = level === 'error' ? optionalParams.at(0) : undefined
    const error =
      message instanceof Error
        ? message
        : typeof traceCandidate === 'string' && traceCandidate.includes('\n')
          ? Object.assign(new Error(messageText(message)), { stack: traceCandidate })
          : undefined
    const data =
      typeof message === 'object' && message !== null && !(message instanceof Error)
        ? message
        : undefined

    this.logger[level](
      {
        event: 'application.log',
        context,
        data,
        error,
      },
      messageText(message),
    )
  }
}

export interface StructuredLoggerBundle {
  readonly logger: Logger
  readonly nestLogger: StructuredLogger
}

export function createStructuredLogger(
  config: ApplicationConfig,
  destination?: DestinationStream,
): StructuredLoggerBundle {
  const logger = pino(
    {
      level: config.logging.level,
      base: {
        service: 'nestjs-hexagonal-boilerplate',
        environment: config.application.environment,
      },
      timestamp: (): string => `,"timestamp":"${new Date().toISOString()}"`,
      formatters: {
        level: (severity: string): { severity: string } => ({ severity }),
      },
      serializers: {
        error: pino.stdSerializers.err,
      },
      redact: {
        paths: [...SENSITIVE_LOG_PATHS],
        censor: REDACTION_MARKER,
      },
    },
    destination,
  )

  return {
    logger,
    nestLogger: new StructuredLogger(logger),
  }
}
