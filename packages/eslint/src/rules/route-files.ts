import path from 'node:path'
import type { Rule } from 'eslint'
import {
  classifyDirectory,
  collectMatchingSiblings,
  parseRoleFilename,
  ROUTE_VERBS,
} from '../route-conventions.js'

const allowedVerbsList = ROUTE_VERBS.join(', ')

const routeFiles: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Enforce descriptive .route naming, unprefixed feature routes, and at most one verb-prefixed .route per verb inside routes/<name>/.',
    },
    schema: [],
    messages: {
      indexRouteName:
        'Route file "{{file}}" must use a descriptive resource name instead of "index" (for example, "users.get.route.ts" inside routes/index/).',
      invalidRouteVerb:
        'Route file "{{file}}" has unsupported modifier "{{modifier}}". Use an unprefixed .route file at the feature root, or one of ({{verbs}}) inside routes/<name>/.',
      routeDirectlyInRoutes:
        'Place route file "{{file}}" inside a named subfolder under routes/, such as routes/index/ for "/" or routes/by-id/ for "/:id".',
      missingRouteVerb:
        'Route file "{{file}}" inside routes/<name>/ must include a method or transport segment before .route, such as ".get.route.ts" or ".ws.route.ts".',
      prefixedRouteOutsideRoutes:
        'Verb-prefixed route "{{file}}" must live under routes/<name>/ (use routes/index/ for "/"). Only an unprefixed .route file is allowed at the feature root.',
      multipleRoutes:
        'Only one unprefixed .route file is allowed per folder. Found: {{files}}. Move sub-routes into routes/<name>/ or extract a separate feature.',
      multipleVerbRoutes:
        'Only one .{{verb}}.route file is allowed per folder. Found: {{files}}. Give distinct sub-paths their own routes/<name>/ folder.',
    },
  },
  create(context) {
    // Skip unnamed/virtual input (for example Linter.verify without filename).
    if (!context.physicalFilename || context.physicalFilename === '<input>') {
      return {}
    }
    const filename = path.resolve(context.cwd, context.physicalFilename)
    const basename = path.basename(filename)
    const parsed = parseRoleFilename(basename, 'route')
    if (!parsed) return {}

    return {
      Program(node) {
        if (parsed.kind === 'invalid-verb') {
          context.report({
            node,
            messageId: 'invalidRouteVerb',
            data: {
              file: basename,
              modifier: parsed.modifier,
              verbs: allowedVerbsList,
            },
          })
          return
        }

        if (parsed.isIndexName) {
          context.report({
            node,
            messageId: 'indexRouteName',
            data: { file: basename },
          })
          return
        }

        const placement = classifyDirectory(path.dirname(filename))
        if (placement === 'routes-root') {
          context.report({
            node,
            messageId: 'routeDirectlyInRoutes',
            data: { file: basename },
          })
          return
        }

        if (placement === 'subroute') {
          if (parsed.verb === undefined) {
            context.report({
              node,
              messageId: 'missingRouteVerb',
              data: { file: basename },
            })
            return
          }

          const siblings = collectMatchingSiblings(filename, (candidate) => {
            const candidateParsed = parseRoleFilename(candidate, 'route')
            return (
              candidateParsed?.kind === 'valid' &&
              !candidateParsed.isIndexName &&
              candidateParsed.verb === parsed.verb
            )
          })
          if (siblings && siblings.length > 1) {
            context.report({
              node,
              messageId: 'multipleVerbRoutes',
              data: { verb: parsed.verb, files: siblings.join(', ') },
            })
          }
          return
        }

        if (parsed.verb !== undefined) {
          context.report({
            node,
            messageId: 'prefixedRouteOutsideRoutes',
            data: { file: basename },
          })
          return
        }

        const siblings = collectMatchingSiblings(filename, (candidate) => {
          const candidateParsed = parseRoleFilename(candidate, 'route')
          return (
            candidateParsed?.kind === 'valid' &&
            !candidateParsed.isIndexName &&
            candidateParsed.verb === undefined
          )
        })
        if (siblings && siblings.length > 1) {
          context.report({
            node,
            messageId: 'multipleRoutes',
            data: { files: siblings.join(', ') },
          })
        }
      },
    }
  },
}

export default routeFiles
