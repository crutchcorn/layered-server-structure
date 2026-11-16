import { eslintCompatPlugin } from '@oxlint/plugins'
import type { Plugin } from '@oxlint/plugins'
import type { ESLint, Linter, Rule } from 'eslint'
import packageJson from '../package.json' with { type: 'json' }
import { recommended } from '../../oxlint/src/presets.js'
import type { RuleScope } from '../../oxlint/src/presets.js'
import { rules } from '../../oxlint/src/rules.js'
import { createStructureConfig } from './structure.js'
import type { StructureConfigOptions } from '../../oxlint/src/config-options.js'

export type LssConfigOptions = StructureConfigOptions

export interface LssPlugin extends ESLint.Plugin {
  rules: {
    'encapsulate-features': Rule.RuleModule
    'feature-imports': Rule.RuleModule
    'handler-imports': Rule.RuleModule
    'logic-imports': Rule.RuleModule
    'middleware-imports': Rule.RuleModule
    'one-logic-per-folder': Rule.RuleModule
    'pure-imports': Rule.RuleModule
    'route-files': Rule.RuleModule
    'service-imports': Rule.RuleModule
  }
  configs: {
    recommended: Linter.Config[]
  }
}

// The shared visitors use typescript-eslint's AST and context types.
const plugin = eslintCompatPlugin({
  meta: {
    name: packageJson.name,
    namespace: 'lss',
    version: packageJson.version,
  },
  rules,
  configs: {
    recommended: [],
  },
} as unknown as Plugin) as unknown as LssPlugin

function createPreset(scopes: RuleScope[]): Linter.Config[] {
  return scopes.map(({ rule, files, ...scope }) => ({
    ...scope,
    name: `lss/${rule}`,
    files,
    plugins: { lss: plugin },
    rules: { [`lss/${rule}`]: 'error' },
  }))
}

plugin.configs.recommended = createPreset(recommended)

export default plugin

/** Apply layer boundaries and the file layout to one server application. */
export function createLssConfig({ root }: LssConfigOptions): Linter.Config[] {
  return [
    ...plugin.configs.recommended.map((config) => ({
      ...config,
      basePath: root,
    })),
    ...createStructureConfig({ root }),
  ]
}
