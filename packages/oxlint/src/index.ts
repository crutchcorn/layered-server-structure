import { definePlugin } from '@oxlint/plugins'
import type { Plugin } from '@oxlint/plugins'
import type { OxlintConfig } from 'oxlint'
import packageJson from '../package.json' with { type: 'json' }
import { folderStructureRule } from './folder-structure-rule.js'
import { createLssFolderStructure } from './folder-structure.js'
import type { StructureConfigOptions } from './config-options.js'
import { recommended } from './presets.js'
import type { RuleScope } from './presets.js'
import { rules } from './rules.js'

export type LssConfigOptions = StructureConfigOptions

// The shared visitors use typescript-eslint's AST and context types.
export default definePlugin({
  meta: {
    name: packageJson.name,
    version: packageJson.version,
  },
  rules: {
    ...rules,
    'folder-structure': folderStructureRule,
  },
} as unknown as Plugin)

const jsPlugins = [{ name: 'lss', specifier: packageJson.name }]

function createPreset(scopes: RuleScope[]): OxlintConfig {
  return {
    jsPlugins,
    overrides: scopes.map(({ rule, files, ignores }) => ({
      files,
      ...(ignores && { excludeFiles: ignores }),
      rules: { [`lss/${rule}`]: 'error' },
    })),
  }
}

export const configs = {
  recommended: createPreset(recommended),
}

/** Apply layer boundaries and the file layout to one Server application. */
export function createLssConfig({ root }: LssConfigOptions): OxlintConfig {
  return {
    ...configs.recommended,
    overrides: [
      ...(configs.recommended.overrides ?? []),
      {
        files: ['src/**/*.{ts,tsx,js,jsx,mjs,cjs,mts,cts}'],
        rules: {
          'lss/folder-structure': ['error', createLssFolderStructure(root)],
        },
      },
    ],
  }
}
