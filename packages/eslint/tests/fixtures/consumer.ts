import { ESLint } from 'eslint'
import type { Linter, Rule } from 'eslint'
import { defineConfig } from 'eslint/config'
import lss, { createLssConfig } from 'lss-eslint-plugin'
import type { LssConfigOptions, LssPlugin } from 'lss-eslint-plugin'

type IsAny<Value> = 0 extends 1 & Value ? true : false
const _pluginIsTyped: IsAny<typeof lss> = false
const _recommendedIsTyped: IsAny<typeof lss.configs.recommended> = false

const _plugin: ESLint.Plugin = lss
const _namedPluginType: LssPlugin = lss
const options: LssConfigOptions = { root: '/project' }
const _encapsulateRule: Rule.RuleModule = lss.rules['encapsulate-features']
const _featureRule: Rule.RuleModule = lss.rules['feature-imports']
const _handlerRule: Rule.RuleModule = lss.rules['handler-imports']
const _logicImportsRule: Rule.RuleModule = lss.rules['logic-imports']
const _serviceRule: Rule.RuleModule = lss.rules['service-imports']
const _routeRule: Rule.RuleModule = lss.rules['route-files']
const _logicRule: Rule.RuleModule = lss.rules['one-logic-per-folder']
const _recommended: Linter.Config[] = lss.configs.recommended
const _application: Linter.Config[] = createLssConfig(options)

const config = defineConfig(
  { plugins: { lss } },
  ...lss.configs.recommended,
  ...createLssConfig({ root: '/project' }),
)

new ESLint({ overrideConfigFile: true, overrideConfig: config })

// @ts-expect-error A project root is required.
createLssConfig()
// @ts-expect-error The options object must include a root.
createLssConfig({})
// @ts-expect-error Project roots must be strings.
createLssConfig({ root: 123 })
// @ts-expect-error Undefined roots are invalid under strictNullChecks.
createLssConfig({ root: undefined })
// @ts-expect-error Unsupported options must not be silently accepted.
createLssConfig({ root: '/project', unknownOption: true })
