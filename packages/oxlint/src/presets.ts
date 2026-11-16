import type { rules } from './rules.js'

const codeExtensions = '{ts,tsx,js,jsx,mjs,cjs,mts,cts}'

export interface RuleScope {
  rule: keyof typeof rules
  files: string[]
  ignores?: string[]
}

export const recommended = [
  {
    rule: 'encapsulate-features',
    files: [`src/**/*.${codeExtensions}`],
  },
  {
    rule: 'feature-imports',
    files: [`src/**/features/**/*.${codeExtensions}`],
  },
  {
    rule: 'handler-imports',
    files: [`src/**/handlers/**/*.${codeExtensions}`],
  },
  {
    rule: 'logic-imports',
    files: ['src/**/*.logic.{ts,js,mts,cts,mjs,cjs}'],
  },
  {
    rule: 'middleware-imports',
    files: [`src/**/middleware/**/*.${codeExtensions}`],
  },
  {
    rule: 'one-logic-per-folder',
    files: ['src/**/*.logic.{ts,js,mts,cts,mjs,cjs}'],
  },
  {
    rule: 'pure-imports',
    files: [`src/**/{utils,schema,constants,types}/**/*.${codeExtensions}`],
  },
  {
    rule: 'route-files',
    files: [`src/**/*.route.${codeExtensions}`],
  },
  {
    rule: 'service-imports',
    files: [`src/**/services/**/*.${codeExtensions}`],
  },
] satisfies RuleScope[]
