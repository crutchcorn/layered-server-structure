import type { TSESLint, TSESTree } from '@typescript-eslint/utils'

function staticSource(
  node: TSESTree.Node | null | undefined,
): string | undefined {
  if (!node) return undefined
  if (node.type === 'Literal' && typeof node.value === 'string') {
    return node.value
  }
  if (node.type === 'TemplateLiteral' && node.expressions.length === 0) {
    return node.quasis[0]?.value.cooked ?? undefined
  }
  // Older TypeScript parser versions represent import types with a literal type.
  if (node.type === 'TSLiteralType') return staticSource(node.literal)
  return undefined
}

function isUnshadowedRequire<MessageIds extends string>(
  context: TSESLint.RuleContext<MessageIds, []>,
  node: TSESTree.CallExpression,
): boolean {
  let scope: TSESLint.Scope.Scope | null = context.sourceCode.getScope(node)
  while (scope) {
    const variable = scope.set.get('require')
    if (variable) return variable.defs.length === 0
    scope = scope.upper
  }
  return true
}

/** Visit statically known module references without resolving application aliases. */
export function visitModuleSources<
  MessageIds extends string = 'forbiddenImport',
>(
  context: TSESLint.RuleContext<MessageIds, []>,
  isForbidden: (source: string) => boolean | MessageIds | undefined,
): TSESLint.RuleListener {
  function check(node: TSESTree.Node | null | undefined): void {
    if (!node) return
    const source = staticSource(node)
    if (source === undefined) return
    const verdict = isForbidden(normalizeModuleSource(source))
    if (verdict) {
      context.report({
        node,
        messageId:
          verdict === true ? ('forbiddenImport' as MessageIds) : verdict,
        data: { source },
      })
    }
  }

  return {
    ImportDeclaration: (node) => check(node.source),
    ExportNamedDeclaration: (node) => check(node.source),
    ExportAllDeclaration: (node) => check(node.source),
    ImportExpression: (node) => check(node.source),
    TSImportType: (node) => check(node.source ?? node.argument),
    TSExternalModuleReference: (node) => check(node.expression),
    CallExpression(node) {
      if (
        node.callee.type === 'Identifier' &&
        node.callee.name === 'require' &&
        isUnshadowedRequire(context, node)
      ) {
        check(node.arguments[0])
      }
    },
  }
}

function normalizeModuleSource(source: string): string {
  const normalized = source.replace(/\\/g, '/')
  // Bundler query/fragment suffixes must not hide a module's file extension.
  // Keep a leading # intact for package.json import aliases.
  const suffixes = [normalized.indexOf('?'), normalized.indexOf('#', 1)].filter(
    (index) => index >= 0,
  )
  return suffixes.length > 0
    ? normalized.slice(0, Math.min(...suffixes))
    : normalized
}

export function isLayer(source: string, layer: string): boolean {
  return source.split('/').includes(layer)
}

export function isModuleKind(source: string, kind: 'route' | 'logic'): boolean {
  // Extensionless imports and both source/output JavaScript extensions count.
  return new RegExp(`\\.${kind}(?:\\.[cm]?[jt]sx?)?$`, 'i').test(source)
}

const routingPackagePrefixes = [
  'hono/',
  '@hono/',
  'fastify/',
  '@fastify/',
  'express/',
  'koa/',
  '@koa/',
  '@nestjs/platform-',
]

const routingPackages = new Set([
  'hono',
  'hono-openapi',
  'fastify',
  'express',
  'koa',
  'h3',
  '@nestjs/common',
  '@nestjs/core',
])

export function isRoutingFramework(source: string): boolean {
  return (
    routingPackages.has(source) ||
    routingPackagePrefixes.some((prefix) => source.startsWith(prefix))
  )
}
