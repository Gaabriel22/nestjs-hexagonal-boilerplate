import { NestFactory } from "@nestjs/core"
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from "@nestjs/platform-fastify"

import { AppModule } from "./app.module"

export async function createApplication(): Promise<NestFastifyApplication> {
  const application = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  )

  application.enableShutdownHooks()

  return application
}
