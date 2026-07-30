import { createApplication } from "./bootstrap"

async function bootstrap(): Promise<void> {
  const application = await createApplication()
  const host = process.env.HOST ?? "0.0.0.0"
  const port = Number(process.env.PORT ?? 3000)

  await application.listen(port, host)
}

void bootstrap()
