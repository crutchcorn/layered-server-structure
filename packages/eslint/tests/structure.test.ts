import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { ESLint } from 'eslint'
import type { Linter } from 'eslint'
import tseslint from 'typescript-eslint'
import { expect, test } from 'vitest'
import type { TestContext } from 'vitest'
import { createLssConfig } from 'lss-eslint-plugin'

const structureRule = 'project-structure/folder-structure'

interface FixtureOptions {
  outsideCwd?: boolean
  additionalConfig?: (root: string) => Linter.Config[]
}

function createFixture(
  context: TestContext,
  { outsideCwd = false, additionalConfig }: FixtureOptions = {},
) {
  const directory = mkdtempSync(path.join(tmpdir(), 'lss-structure-'))
  context.onTestFinished(() =>
    rmSync(directory, { recursive: true, force: true }),
  )
  const root = path.join(directory, 'backend')
  mkdirSync(root)
  const eslint = new ESLint({
    cwd: outsideCwd ? directory : root,
    overrideConfigFile: true,
    overrideConfig: [
      {
        files: ['**/*.{ts,tsx,js,jsx,mjs,cjs,mts,cts}'],
        languageOptions: { parser: tseslint.parser },
      },
      ...(additionalConfig?.(root) ?? []),
      ...createLssConfig({ root }),
    ],
  })

  return {
    directory,
    root,
    eslint,
    async lint(filename: string, code = '') {
      const [result] = await eslint.lintText(code, {
        filePath: path.join(root, filename),
      })
      expect.assert(result, 'The candidate file must be selected for linting')
      return result
    },
    write(filename: string, contents: string) {
      const target = path.join(root, filename)
      mkdirSync(path.dirname(target), { recursive: true })
      writeFileSync(target, contents)
      return target
    },
  }
}

for (const filename of [
  'src/app.ts',
  'src/index.ts',
  'src/main.ts',
  'src/server.ts',
  'src/app.spec.ts',
  'src/constants/open-api.ts',
  'src/handlers/problem-json.ts',
  'src/handlers/problem-json.spec.ts',
  'src/middleware/require-auth.ts',
  'src/middleware/auth/verify-token.test.ts',
  'src/schema/index.ts',
  'src/schema/users.ts',
  'src/services/db.ts',
  'src/services/cache/redis.spec.ts',
  'src/services/schemas/external-api.d.ts',
  'src/types/auth.ts',
  'src/types/environment.d.ts',
  'src/utils/pagination.ts',
  'src/utils/testing-utils/create-test-db.ts',
  'src/assets/templates/welcome.html',
  'src/features/users/users.route.ts',
  'src/features/users/users.logic.ts',
  'src/features/users/users.route.spec.ts',
  'src/features/users/users.logic.test.ts',
  'src/features/users/index.ts',
  'src/features/users/middleware/require-user.ts',
  'src/features/users/handlers/send-user.ts',
  'src/features/users/services/user-cache.ts',
  'src/features/users/utils/schema.ts',
  'src/features/users/constants/limits.ts',
  'src/features/users/types/user.ts',
  'src/features/users/routes/index/users.get.route.ts',
  'src/features/users/routes/index/users.post.route.ts',
  'src/features/users/routes/index/users.get.logic.ts',
  'src/features/users/routes/index/users.get.route.spec.ts',
  'src/features/users/routes/index/users.get.spec.ts',
  'src/features/users/routes/index/middleware/describe.ts',
  'src/features/users/routes/by-id/user-by-id.get.route.ts',
  'src/features/users/routes/by-id/user-by-id.delete.route.ts',
  'src/features/messages/routes/index/messages.ws.route.ts',
]) {
  test(`structure accepts ${filename}`, async (context) => {
    const result = await createFixture(context).lint(filename)
    expect(result.messages).toEqual([])
  })
}

for (const filename of [
  'src/data/users.ts',
  'src/data/projectStructure.cache.json',
  'src/controllers/users.ts',
  'src/middlewares/auth.ts',
  'src/routes/users.ts',
  'src/helpers/format.ts',
  'src/users.ts',
  'src/features/Users/users.route.ts',
  'src/features/user_accounts/users.route.ts',
  'src/features/index/users.route.ts',
  'src/features/users/by-id/user-by-id.get.route.ts',
  'src/features/users/foo/helper.ts',
  'src/features/users/index.route.ts',
  'src/features/users/users.get.route.ts',
  'src/features/users/routes/users.get.route.ts',
  'src/features/users/routes/index/users.route.ts',
  'src/features/users/routes/index/index.get.route.ts',
  'src/features/users/routes/index/users.list.route.ts',
  'src/features/users/routes/by-id/index.get.route.ts',
  'src/utils/errors/ErrorMessage.ts',
  'src/assets/templates/extensionless',
]) {
  test(`structure rejects ${filename}`, async (context) => {
    const result = await createFixture(context).lint(filename)
    expect(result.messages.map((message) => message.ruleId)).toContain(
      structureRule,
    )
  })
}

test('absolute project root works when ESLint runs from its parent directory', async (context) => {
  const fixture = createFixture(context, { outsideCwd: true })
  expect(
    (await fixture.lint('src/features/users/routes/index/users.get.route.ts'))
      .messages,
  ).toEqual([])
  const invalid = await fixture.lint('src/features/users/data/users.ts')
  expect(invalid.messages[0]?.ruleId).toBe(structureRule)
})

test('separate ESLint instances report every file in the same invalid folder', async (context) => {
  const fixture = createFixture(context)
  const first = fixture.write('src/data/first.ts', 'export const first = 1')
  const second = fixture.write('src/data/second.ts', 'export const second = 2')
  const [firstResult] = await fixture.eslint.lintFiles([first])
  expect.assert(firstResult)
  expect(firstResult.messages.map((message) => message.ruleId)).toEqual([
    structureRule,
  ])
  const projectCache = path.join(fixture.root, 'projectStructure.cache.json')
  expect(existsSync(projectCache)).toBe(false)

  const nextESLint = new ESLint({
    cwd: fixture.root,
    overrideConfigFile: true,
    overrideConfig: [
      {
        files: ['**/*.ts'],
        languageOptions: { parser: tseslint.parser },
      },
      ...createLssConfig({ root: fixture.root }),
    ],
  })
  const [secondResult] = await nextESLint.lintFiles([second])
  expect.assert(secondResult)
  expect(secondResult.messages.map((message) => message.ruleId)).toEqual([
    structureRule,
  ])
  expect(existsSync(projectCache)).toBe(false)
})

test('filesystem lint includes non-code assets, unknown extensions, and extensionless files', async (context) => {
  const fixture = createFixture(context)
  const expected = new Map([
    ['src/assets/templates/welcome.html', false],
    ['src/assets/queries/seed.sql', false],
    ['src/assets/templates/UnsubscribeEmail.html', true],
    ['src/assets/templates/welcome.unknown', true],
    ['src/assets/templates/extensionless', true],
  ])
  for (const filename of expected.keys()) {
    fixture.write(filename, 'content')
  }

  const results = await fixture.eslint.lintFiles(['src'])
  expect(results).toHaveLength(expected.size)
  for (const result of results) {
    const filename = path
      .relative(fixture.root, result.filePath)
      .replaceAll(path.sep, '/')
    expect(expected.has(filename), `Unexpected lint result: ${filename}`).toBe(
      true,
    )
    expect(
      result.messages.map((message) => message.ruleId),
      filename,
    ).toEqual(expected.get(filename) ? [structureRule] : [])
  }
})

test('structure factory requires an explicit absolute project directory', () => {
  for (const root of ['.', 'apps/backend', '']) {
    expect(() => createLssConfig({ root })).toThrow(
      /absolute project directory/,
    )
  }
  expect(
    // @ts-expect-error JavaScript callers can omit the required root value.
    () => createLssConfig({ root: undefined }),
  ).toThrow(/absolute project directory/)
})
