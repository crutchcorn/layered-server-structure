import type { TSESLint } from '@typescript-eslint/utils'
import {
  isLayer,
  isModuleKind,
  isRoutingFramework,
  visitModuleSources,
} from '../module-sources.js'

const logicImports: TSESLint.RuleModule<'forbiddenImport', []> = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Keep .logic modules independent of HTTP routing frameworks and request/response layers.',
    },
    schema: [],
    messages: {
      forbiddenImport:
        'Logic modules must not import "{{source}}". Keep .logic files independent of routing frameworks, middleware, handlers, and .route files so business orchestration can run without req/res.',
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
        isModuleKind(source, 'route'),
    )
  },
}

export default logicImports
