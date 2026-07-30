import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import ts from 'typescript'

export type ProtectedLayer = 'domain' | 'application'

export interface ArchitectureViolation {
  readonly filePath: string
  readonly layer: ProtectedLayer
  readonly moduleSpecifier: string
  readonly reason: string
}

const FRAMEWORK_AND_ADAPTER_IMPORTS = [
  '@fastify',
  '@nestjs',
  '@prisma',
  '@scalar',
  'fastify',
  'node:http',
  'node:https',
  'prisma',
]

function normalizePath(value: string): string {
  return value.replaceAll('\\', '/')
}

function getProtectedLayer(filePath: string): ProtectedLayer | undefined {
  const normalizedPath = `/${normalizePath(filePath)}/`

  if (normalizedPath.includes('/domain/')) {
    return 'domain'
  }

  if (normalizedPath.includes('/application/')) {
    return 'application'
  }

  return undefined
}

function matchesImportPrefix(moduleSpecifier: string, prefix: string): boolean {
  return moduleSpecifier === prefix || moduleSpecifier.startsWith(`${prefix}/`)
}

export function getForbiddenImportReason(
  layer: ProtectedLayer,
  moduleSpecifier: string,
): string | undefined {
  const normalizedSpecifier = normalizePath(moduleSpecifier)
  const externalDependency = FRAMEWORK_AND_ADAPTER_IMPORTS.find((prefix) =>
    matchesImportPrefix(normalizedSpecifier, prefix),
  )

  if (externalDependency !== undefined) {
    return `${layer} cannot import framework or adapter dependency "${externalDependency}"`
  }

  if (normalizedSpecifier.includes('/infrastructure/')) {
    return `${layer} cannot import infrastructure`
  }

  if (layer === 'domain' && normalizedSpecifier.includes('/application/')) {
    return 'domain cannot import application'
  }

  return undefined
}

function collectModuleSpecifiers(sourceText: string, filePath: string): string[] {
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  )
  const moduleSpecifiers: string[] = []

  function visit(node: ts.Node): void {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier !== undefined &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      moduleSpecifiers.push(node.moduleSpecifier.text)
    }

    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length === 1
    ) {
      const [argument] = node.arguments

      if (argument !== undefined && ts.isStringLiteral(argument)) {
        moduleSpecifiers.push(argument.text)
      }
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return moduleSpecifiers
}

async function collectTypeScriptFiles(directoryPath: string): Promise<string[]> {
  const entries = await readdir(directoryPath, { withFileTypes: true })
  const files = await Promise.all(
    entries.map(async (entry): Promise<string[]> => {
      const entryPath = path.join(directoryPath, entry.name)

      if (entry.isDirectory()) {
        return collectTypeScriptFiles(entryPath)
      }

      return entry.isFile() && entry.name.endsWith('.ts') ? [entryPath] : []
    }),
  )

  return files.flat()
}

export async function findArchitectureViolations(
  sourceRoot: string,
): Promise<ArchitectureViolation[]> {
  const filePaths = await collectTypeScriptFiles(sourceRoot)
  const violations = await Promise.all(
    filePaths.map(async (filePath): Promise<ArchitectureViolation[]> => {
      const layer = getProtectedLayer(filePath)

      if (layer === undefined) {
        return []
      }

      const sourceText = await readFile(filePath, 'utf8')

      return collectModuleSpecifiers(sourceText, filePath).flatMap((moduleSpecifier) => {
        const reason = getForbiddenImportReason(layer, moduleSpecifier)

        return reason === undefined
          ? []
          : [{ filePath, layer, moduleSpecifier, reason } satisfies ArchitectureViolation]
      })
    }),
  )

  return violations.flat()
}
