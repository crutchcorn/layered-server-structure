import path from 'node:path'
import type { Rule } from 'eslint'
import {
  classifyDirectory,
  collectMatchingSiblings,
  parseRoleFilename,
  ROUTE_VERBS,
} from '../route-conventions.js'

const allowedVerbsList = ROUTE_VERBS.join(', ')

const oneLogicPerFolder: Rule.RuleModule = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Enforce descriptive .logic naming, at most one unprefixed .logic file at a feature root, and at most one .<verb>.logic file per verb inside routes/<name>/.',
    },
    schema: [],
    messages: {
      indexLogicName:
        'Logic file "{{file}}" must use a descriptive resource name instead of "index" (for example, "users.get.logic.ts" inside routes/index/).',
      invalidLogicVerb:
        'Logic file "{{file}}" has unsupported modifier "{{modifier}}". Use an unprefixed .logic file at the feature root, or one of ({{verbs}}) inside routes/<name>/.',
      logicDirectlyInRoutes:
        'Place logic file "{{file}}" inside a named subfolder under routes/, such as routes/index/ or routes/by-id/.',
      missingLogicVerb:
        'Logic file "{{file}}" inside routes/<name>/ must include a method or transport segment before .logic, such as ".get.logic.ts".',
      prefixedLogicOutsideRoutes:
        'Verb-prefixed logic file "{{file}}" must live under routes/<name>/. Only an unprefixed .logic file is allowed at the feature root.',
      multipleLogicFiles:
        'Only one unprefixed .logic file is allowed per folder. Found: {{files}}. Move reusable calculations into utils/ or I/O into services/.',
      multipleVerbLogicFiles:
        'Only one .{{verb}}.logic file is allowed per folder. Found: {{files}}. Move reusable calculations into utils/ or I/O into services/.',
    },
  },
  create(context) {
    if (!context.physicalFilename || context.physicalFilename === '<input>') {
      return {}
    }
    const filename = path.resolve(context.cwd, context.physicalFilename)
    const basename = path.basename(filename)
    const parsed = parseRoleFilename(basename, 'logic')
    if (!parsed) return {}

    return {
      Program(node) {
        if (parsed.kind === 'invalid-verb') {
          context.report({
            node,
            messageId: 'invalidLogicVerb',
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
            messageId: 'indexLogicName',
            data: { file: basename },
          })
          return
        }

        const placement = classifyDirectory(path.dirname(filename))
        if (placement === 'routes-root') {
          context.report({
            node,
            messageId: 'logicDirectlyInRoutes',
            data: { file: basename },
          })
          return
        }

        if (placement === 'subroute') {
          if (parsed.verb === undefined) {
            context.report({
              node,
              messageId: 'missingLogicVerb',
              data: { file: basename },
            })
            return
          }

          const siblings = collectMatchingSiblings(filename, (candidate) => {
            const candidateParsed = parseRoleFilename(candidate, 'logic')
            return (
              candidateParsed?.kind === 'valid' &&
              !candidateParsed.isIndexName &&
              candidateParsed.verb === parsed.verb
            )
          })
          if (siblings && siblings.length > 1) {
            context.report({
              node,
              messageId: 'multipleVerbLogicFiles',
              data: { verb: parsed.verb, files: siblings.join(', ') },
            })
          }
          return
        }

        if (parsed.verb !== undefined) {
          context.report({
            node,
            messageId: 'prefixedLogicOutsideRoutes',
            data: { file: basename },
          })
          return
        }

        const siblings = collectMatchingSiblings(filename, (candidate) => {
          const candidateParsed = parseRoleFilename(candidate, 'logic')
          return (
            candidateParsed?.kind === 'valid' &&
            !candidateParsed.isIndexName &&
            candidateParsed.verb === undefined
          )
        })
        if (siblings && siblings.length > 1) {
          context.report({
            node,
            messageId: 'multipleLogicFiles',
            data: { files: siblings.join(', ') },
          })
        }
      },
    }
  },
}

export default oneLogicPerFolder
