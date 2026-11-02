import type { TSESLint } from '@typescript-eslint/utils'
import {
  isLayer,
  isModuleKind,
  isRoutingFramework,
  visitModuleSources,
} from '../module-sources.js'

const pureLayers = new Set(['utils', 'schema', 'constants', 'types'])

function innermostPureLayer(filename: string): string | undefined {
  const segments = filename.replace(/\\/g, '/').split('/')
  segments.pop()
  for (let index = segments.length - 1; index >= 0; index -= 1) {
    const segment = segments[index]
    if (segment !== undefined && pureLayers.has(segment)) return segment
  }
  return undefined
}

const pureImports: TSESLint.RuleModule<'forbiddenImport', []> = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Keep utils, schema, constants, and types independent of services, middleware, handlers, routes, logic, and runtime router frameworks.',
    },
    schema: [],
    messages: {
      forbiddenImport:
        'Pure modules in utils/, schema/, constants/, and types/ must not import "{{source}}". Keep foundational values, types, and schemas independent of services, middleware, handlers, routes, logic, and runtime router frameworks.',
    },
  },
  create(context) {
    const layer = innermostPureLayer(context.filename)
    const allowsFrameworkTypes = layer === 'constants' || layer === 'types'

    return visitModuleSources(
      context,
      (source, { isTypeOnly }) =>
        isLayer(source, 'services') ||
        isLayer(source, 'middleware') ||
        isLayer(source, 'handlers') ||
        isLayer(source, 'routes') ||
        isModuleKind(source, 'route') ||
        isModuleKind(source, 'logic') ||
        (isRoutingFramework(source) && !(allowsFrameworkTypes && isTypeOnly)),
    )
  },
}

export default pureImports
