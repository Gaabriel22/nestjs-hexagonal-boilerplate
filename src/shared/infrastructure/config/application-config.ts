import 'dotenv/config'

import { parseEnvironment } from './parse-environment'

export const applicationConfig = parseEnvironment(process.env)
