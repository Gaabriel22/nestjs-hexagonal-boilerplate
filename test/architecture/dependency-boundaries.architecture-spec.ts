import path from 'node:path'

import {
  findArchitectureViolations,
  getForbiddenImportReason,
  type ProtectedLayer,
} from '../support/architecture-rules'

describe('dependency boundaries', () => {
  it.each([
    ['domain', '@nestjs/common'],
    ['domain', 'fastify'],
    ['domain', '@prisma/client'],
    ['domain', '../application/create-user'],
    ['domain', '../infrastructure/prisma-user.repository'],
    ['application', 'node:http'],
    ['application', '@scalar/nestjs-api-reference'],
    ['application', '../infrastructure/prisma-user.repository'],
  ] satisfies ReadonlyArray<readonly [ProtectedLayer, string]>)(
    'rejects %s import of %s',
    (layer, moduleSpecifier) => {
      expect(getForbiddenImportReason(layer, moduleSpecifier)).toBeDefined()
    },
  )

  it.each([
    ['domain', '../email'],
    ['domain', './user'],
    ['application', '../domain/user'],
    ['application', './create-user'],
  ] satisfies ReadonlyArray<readonly [ProtectedLayer, string]>)(
    'allows %s import of %s',
    (layer, moduleSpecifier) => {
      expect(getForbiddenImportReason(layer, moduleSpecifier)).toBeUndefined()
    },
  )

  it('finds no outward imports in protected source layers', async () => {
    const sourceRoot = path.resolve(process.cwd(), 'src')

    await expect(findArchitectureViolations(sourceRoot)).resolves.toEqual([])
  })
})
