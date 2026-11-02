import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { ESLint } from 'eslint'
import plugin from 'lss-eslint-plugin'
import tseslint from 'typescript-eslint'
import { expect, test } from 'vitest'
import type { TestContext } from 'vitest'

const ruleId = 'lss/one-logic-per-folder'

function createFixture(context: TestContext) {
  const directory = mkdtempSync(path.join(tmpdir(), 'lss-logic-'))
  context.onTestFinished(() =>
    rmSync(directory, { recursive: true, force: true }),
  )
  const root = path.join(directory, 'backend')
  mkdirSync(root)
  const eslint = new ESLint({
    cwd: root,
    overrideConfigFile: true,
    overrideConfig: [
      {
        files: ['**/*.ts'],
        languageOptions: { parser: tseslint.parser },
      },
      ...plugin.configs.recommended,
    ],
  })

  return {
    root,
    eslint,
    write(filename: string) {
      const target = path.join(root, filename)
      mkdirSync(path.dirname(target), { recursive: true })
      writeFileSync(target, 'export const run = () => null')
      return target
    },
    async lintFile(filename: string) {
      const [result] = await eslint.lintFiles([filename])
      expect.assert(result, 'The logic file must be selected for linting')
      return result.messages
    },
  }
}

test('allows one unprefixed .logic.ts at feature root and one .<verb>.logic.ts per verb in routes/<name>/', async (context) => {
  const fixture = createFixture(context)
  const featureLogic = fixture.write('src/features/users/users.logic.ts')
  const getLogic = fixture.write(
    'src/features/users/routes/index/users.get.logic.ts',
  )
  const postLogic = fixture.write(
    'src/features/users/routes/index/users.post.logic.ts',
  )
  fixture.write('src/features/users/routes/index/users.get.logic.spec.ts')

  expect(await fixture.lintFile(featureLogic)).toEqual([])
  expect(await fixture.lintFile(getLogic)).toEqual([])
  expect(await fixture.lintFile(postLogic)).toEqual([])
})

test('reports duplicate unprefixed logic files, duplicate verb logic files, and index-named logic files', async (context) => {
  const fixture = createFixture(context)
  const first = fixture.write('src/features/users/users.logic.ts')
  const second = fixture.write('src/features/users/accounts.logic.ts')

  expect(await fixture.lintFile(first)).toEqual([
    expect.objectContaining({ ruleId, messageId: 'multipleLogicFiles' }),
  ])
  unlinkSync(second)
  expect(await fixture.lintFile(first)).toEqual([])

  const firstGet = fixture.write(
    'src/features/users/routes/index/users.get.logic.ts',
  )
  fixture.write('src/features/users/routes/index/other-users.get.logic.ts')
  expect(await fixture.lintFile(firstGet)).toEqual([
    expect.objectContaining({ ruleId, messageId: 'multipleVerbLogicFiles' }),
  ])

  const indexLogic = fixture.write(
    'src/features/users/routes/by-id/index.get.logic.ts',
  )
  expect(await fixture.lintFile(indexLogic)).toEqual([
    expect.objectContaining({ ruleId, messageId: 'indexLogicName' }),
  ])
})
