import type { ESLint, Linter, Rule } from 'eslint'
import packageJson from '../package.json' with { type: 'json' }

export type LssConfigOptions = StructureConfigOptions

export interface LssPlugin extends ESLint.Plugin {
  rules: {
  }
  configs: {
    recommended: Linter.Config[]
  }
}

const plugin: LssPlugin = {
  meta: {
    name: packageJson.name,
    namespace: 'lss',
    version: packageJson.version,
  },
  rules: {
  },
  configs: {
    recommended: [],
  },
}

plugin.configs.recommended = [
]

export default plugin

/** Apply layer boundaries and the file layout to one Server application. */
export function createLssConfig({ root }: LssConfigOptions): Linter.Config[] {
  return [
    ...plugin.configs.recommended.map((config) => ({
      ...config,
      basePath: root,
    })),
    ...createStructureConfig({ root }),
  ]
}
