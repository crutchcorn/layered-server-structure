import type { TSESLint } from '@typescript-eslint/utils'
import {
  isLayer,
  isModuleKind,
  isRoutingFramework,
  visitModuleSources,
} from '../module-sources.js'

const serviceImports: TSESLint.RuleModule<'forbiddenImport', []> = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Keep I/O services independent of HTTP routing frameworks and routing layers.',
    },
    schema: [],
    messages: {
      forbiddenImport:
        'Services must not import "{{source}}". Services own I/O and resource lifetimes; keep routing frameworks, middleware, handlers, routes, and logic modules outside the service layer.',
    },
  },
  create(context) {
    return visitModuleSources(
      context,
      (source) =>
        isRoutingFramework(source) ||
        isLayer(source, 'middleware') ||
        isLayer(source, 'handlers') ||
        isLayer(source, 'routes') ||
        isModuleKind(source, 'route') ||
        isModuleKind(source, 'logic'),
    )
  },
}

export default serviceImports
