import type { TSESLint } from '@typescript-eslint/utils'
import { isLayer, isModuleKind, visitModuleSources } from '../module-sources.js'

const handlerImports: TSESLint.RuleModule<'forbiddenImport', []> = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Keep reusable request/response handlers independent of services, middleware, and route orchestration.',
    },
    schema: [],
    messages: {
      forbiddenImport:
        'Handlers must not import "{{source}}". Keep reusable request/response transport independent of services, middleware, routes, and logic modules; compose those in a .route file.',
    },
  },
  create(context) {
    return visitModuleSources(
      context,
      (source) =>
        isLayer(source, 'services') ||
        isLayer(source, 'middleware') ||
        isLayer(source, 'routes') ||
        isModuleKind(source, 'route') ||
        isModuleKind(source, 'logic'),
    )
  },
}

export default handlerImports
