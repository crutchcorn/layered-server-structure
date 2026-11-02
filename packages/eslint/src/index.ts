import type { ESLint, Linter, Rule } from 'eslint'
import packageJson from '../package.json' with { type: 'json' }
import featureImports from './rules/feature-imports.js'
import handlerImports from './rules/handler-imports.js'
import logicImports from './rules/logic-imports.js'
import middlewareImports from './rules/middleware-imports.js'
import oneLogicPerFolder from './rules/one-logic-per-folder.js'
import pureImports from './rules/pure-imports.js'
import routeFiles from './rules/route-files.js'
import serviceImports from './rules/service-imports.js'
import { createStructureConfig } from './structure.js'
import type { StructureConfigOptions } from './structure.js'

export type LssConfigOptions = StructureConfigOptions

export interface LssPlugin extends ESLint.Plugin {
  rules: {
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

const plugin: LssPlugin = {
  meta: {
    name: packageJson.name,
    namespace: 'lss',
    version: packageJson.version,
  },
  rules: {
    'one-logic-per-folder': oneLogicPerFolder,
    'route-files': routeFiles,
    // TypeScript visitors extend ESTree; ESLint's runtime accepts these rules.
    'feature-imports': featureImports as unknown as Rule.RuleModule,
    'handler-imports': handlerImports as unknown as Rule.RuleModule,
    'logic-imports': logicImports as unknown as Rule.RuleModule,
    'middleware-imports': middlewareImports as unknown as Rule.RuleModule,
    'pure-imports': pureImports as unknown as Rule.RuleModule,
    'service-imports': serviceImports as unknown as Rule.RuleModule,
  },
  configs: {
    recommended: [],
  },
}

const codeExtensions = '{ts,tsx,js,jsx,mjs,cjs,mts,cts}'

plugin.configs.recommended = [
  {
    name: 'lss/feature-imports',
    files: [`src/**/features/**/*.${codeExtensions}`],
    plugins: { lss: plugin },
    rules: { 'lss/feature-imports': 'error' },
  },
  {
    name: 'lss/handler-imports',
    files: [`src/**/handlers/**/*.${codeExtensions}`],
    plugins: { lss: plugin },
    rules: { 'lss/handler-imports': 'error' },
  },
  {
    name: 'lss/logic-imports',
    files: ['src/**/*.logic.{ts,js,mts,cts,mjs,cjs}'],
    plugins: { lss: plugin },
    rules: { 'lss/logic-imports': 'error' },
  },
  {
    name: 'lss/middleware-imports',
    files: [`src/**/middleware/**/*.${codeExtensions}`],
    plugins: { lss: plugin },
    rules: { 'lss/middleware-imports': 'error' },
  },
  {
    name: 'lss/one-logic-per-folder',
    files: ['src/**/*.logic.{ts,js,mts,cts,mjs,cjs}'],
    plugins: { lss: plugin },
    rules: { 'lss/one-logic-per-folder': 'error' },
  },
  {
    name: 'lss/pure-imports',
    files: [`src/**/{utils,schema,constants,types}/**/*.${codeExtensions}`],
    plugins: { lss: plugin },
    rules: { 'lss/pure-imports': 'error' },
  },
  {
    name: 'lss/route-files',
    files: [`src/**/*.route.${codeExtensions}`],
    plugins: { lss: plugin },
    rules: { 'lss/route-files': 'error' },
  },
  {
    name: 'lss/service-imports',
    files: [`src/**/services/**/*.${codeExtensions}`],
    plugins: { lss: plugin },
    rules: { 'lss/service-imports': 'error' },
  },
]

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
