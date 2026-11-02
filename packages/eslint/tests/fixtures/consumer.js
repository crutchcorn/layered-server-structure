import { mkdirSync, writeFileSync } from 'node:fs'
import process from 'node:process'
import { ESLint } from 'eslint'
import { defineConfig } from 'eslint/config'
import lss, { createLssConfig } from 'lss-eslint-plugin'

const eslint = new ESLint({
  overrideConfigFile: true,
  overrideConfig: defineConfig(...lss.configs.recommended),
})
const [serviceResult] = await eslint.lintText("import { Hono } from 'hono'", {
  filePath: 'src/services/db.js',
})

mkdirSync('src/features/users/routes/index', { recursive: true })
writeFileSync('src/features/users/routes/index/other-users.get.route.js', '')
const [routeResult] = await eslint.lintText('export const users = []', {
  filePath: 'src/features/users/routes/index/users.get.route.js',
})

writeFileSync('src/features/users/other.logic.ts', '')
const [logicResult] = await eslint.lintText('export const users = []', {
  filePath: 'src/features/users/users.logic.ts',
})

const [featureResult] = await eslint.lintText(
  "import { messages } from '../messages/messages.route'",
  { filePath: 'src/features/users/users.route.js' },
)

const combined = new ESLint({
  overrideConfigFile: true,
  overrideConfig: defineConfig(...createLssConfig({ root: process.cwd() })),
})
const [structureResult] = await combined.lintText('export const value = 1', {
  filePath: 'src/controllers/invalid.js',
})

process.stdout.write(
  JSON.stringify({
    importRuleIds: serviceResult?.messages.map((message) => message.ruleId),
    routeRuleIds: routeResult?.messages.map((message) => message.ruleId),
    logicRuleIds: logicResult?.messages.map((message) => message.ruleId),
    featureRuleIds: featureResult?.messages.map((message) => message.ruleId),
    structureRuleIds: structureResult?.messages.map(
      (message) => message.ruleId,
    ),
  }),
)
