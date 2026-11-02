import type { TSESLint } from '@typescript-eslint/utils'
import { isLayer, isModuleKind, visitModuleSources } from '../module-sources.js'

const middlewareImports: TSESLint.RuleModule<'forbiddenImport', []> = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Keep middleware independent of routes and logic modules to prevent circular dependencies.',
    },
    schema: [],
    messages: {
      forbiddenImport:
        'Middleware must not import "{{source}}". Keep request-lifecycle middleware independent of routes and .logic modules; wire middleware onto endpoints inside a .route file.',
    },
  },
  create(context) {
    return visitModuleSources(
      context,
      (source) =>
        isLayer(source, 'routes') ||
        isModuleKind(source, 'route') ||
        isModuleKind(source, 'logic'),
    )
  },
}

export default middlewareImports
