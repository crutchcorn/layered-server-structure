import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { ESLint, Linter } from 'eslint'
import plugin, { createLssConfig } from 'lss-eslint-plugin'
import tseslint from 'typescript-eslint'
import { expect, test } from 'vitest'
import type { TestContext } from 'vitest'

const ruleId = 'lss/route-files'

function createFixture(
  context: TestContext,
  { combined = false, manual = false } = {},
) {
  const directory = mkdtempSync(path.join(tmpdir(), 'lss-routes-'))
  context.onTestFinished(() =>
    rmSync(directory, { recursive: true, force: true }),
  )
  const root = path.join(directory, 'backend')
  mkdirSync(root)
  const eslint = new ESLint({
    cwd: combined ? directory : root,
    overrideConfigFile: true,
    overrideConfig: [
      {
        files: ['**/*.{ts,tsx,js,jsx,mjs,cjs,mts,cts}'],
        languageOptions: { parser: tseslint.parser },
      },
      ...(manual
        ? [{ plugins: { lss: plugin }, rules: { [ruleId]: 'error' as const } }]
        : combined
          ? createLssConfig({ root })
          : plugin.configs.recommended),
    ],
  })

  return {
    root,
    eslint,
    write(filename: string, contents = 'export const route = 1') {
      const target = path.join(root, filename)
      mkdirSync(path.dirname(target), { recursive: true })
      writeFileSync(target, contents)
      return target
    },
    async lintFile(filename: string) {
      const [result] = await eslint.lintFiles([filename])
      expect.assert(result, 'The route file must be selected for linting')
      return result.messages
    },
  }
}

test('feature root allows one unprefixed .route.ts alongside verb routes under routes/<name>/', async (context) => {
  const fixture = createFixture(context)
  fixture.write('src/features/users/users.route.ts')
  fixture.write('src/features/users/routes/index/users.get.route.ts')
  fixture.write('src/features/users/routes/index/users.post.route.ts')
  fixture.write('src/features/users/routes/index/users.ws.route.ts')
  fixture.write('src/features/users/routes/by-id/user-by-id.get.route.ts')
  fixture.write('src/features/users/routes/by-id/user-by-id.delete.route.ts')

  const results = await fixture.eslint.lintFiles(['src'])
  expect(results).toHaveLength(6)
  expect(results.flatMap((result) => result.messages)).toEqual([])
})

test('feature root rejects verb-prefixed route files and multiple unprefixed route files', async (context) => {
  const fixture = createFixture(context)
  const prefixed = fixture.write('src/features/users/users.get.route.ts')
  expect(await fixture.lintFile(prefixed)).toEqual([
    expect.objectContaining({
      ruleId,
      messageId: 'prefixedRouteOutsideRoutes',
      severity: 2,
    }),
  ])
  unlinkSync(prefixed)

  const first = fixture.write('src/features/users/users.route.ts')
  const second = fixture.write('src/features/users/accounts.route.ts')
  for (const file of [first, second]) {
    expect(await fixture.lintFile(file)).toEqual([
      expect.objectContaining({
        ruleId,
        messageId: 'multipleRoutes',
        severity: 2,
      }),
    ])
  }
})

test('routes/<name>/ allows one file per verb and reports duplicate verbs', async (context) => {
  const fixture = createFixture(context)
  const firstGet = fixture.write(
    'src/features/users/routes/index/users.get.route.ts',
  )
  const post = fixture.write(
    'src/features/users/routes/index/users.post.route.ts',
  )
  const secondGet = fixture.write(
    'src/features/users/routes/index/active-users.get.route.ts',
  )

  const duplicateGet = expect.objectContaining({
    ruleId,
    messageId: 'multipleVerbRoutes',
    severity: 2,
  })
  expect(await fixture.lintFile(firstGet)).toEqual([duplicateGet])
  expect(await fixture.lintFile(secondGet)).toEqual([duplicateGet])
  expect(await fixture.lintFile(post)).toEqual([])

  unlinkSync(secondGet)
  expect(await fixture.lintFile(firstGet)).toEqual([])
})

test('rejects index-named routes, unprefixed routes inside routes/<name>/, unknown verbs, and routes directly in routes/', async (context) => {
  const fixture = createFixture(context)

  const indexAtRoot = fixture.write('src/features/users/index.route.ts')
  expect(await fixture.lintFile(indexAtRoot)).toEqual([
    expect.objectContaining({ ruleId, messageId: 'indexRouteName' }),
  ])

  const indexInSubroute = fixture.write(
    'src/features/users/routes/index/index.get.route.ts',
  )
  expect(await fixture.lintFile(indexInSubroute)).toEqual([
    expect.objectContaining({ ruleId, messageId: 'indexRouteName' }),
  ])

  const unprefixedInSubroute = fixture.write(
    'src/features/users/routes/index/users.route.ts',
  )
  expect(await fixture.lintFile(unprefixedInSubroute)).toEqual([
    expect.objectContaining({ ruleId, messageId: 'missingRouteVerb' }),
  ])

  const invalidVerb = fixture.write(
    'src/features/users/routes/index/users.list.route.ts',
  )
  expect(await fixture.lintFile(invalidVerb)).toEqual([
    expect.objectContaining({ ruleId, messageId: 'invalidRouteVerb' }),
  ])

  const directlyInRoutes = fixture.write(
    'src/features/users/routes/users.get.route.ts',
  )
  expect(await fixture.lintFile(directlyInRoutes)).toEqual([
    expect.objectContaining({ ruleId, messageId: 'routeDirectlyInRoutes' }),
  ])
})

test('unsaved editor buffers and symlinks count toward per-verb limits while tests and directories do not', async (context) => {
  const fixture = createFixture(context)
  const getRoute = fixture.write(
    'src/features/users/routes/index/users.get.route.ts',
  )
  fixture.write('src/features/users/routes/index/users.get.route.spec.ts')
  fixture.write('src/features/users/routes/index/users.get.test.ts')
  const directory = path.join(
    fixture.root,
    'src/features/users/routes/index/dir.get.route.ts',
  )
  mkdirSync(directory)
  symlinkSync(
    directory,
    path.join(
      fixture.root,
      'src/features/users/routes/index/link-dir.get.route.ts',
    ),
  )

  expect(await fixture.lintFile(getRoute)).toEqual([])

  const [unsavedResult] = await fixture.eslint.lintText(
    'export const extra = 1',
    {
      filePath: path.join(
        fixture.root,
        'src/features/users/routes/index/extra.get.route.ts',
      ),
    },
  )
  expect(unsavedResult?.messages).toEqual([
    expect.objectContaining({ ruleId, messageId: 'multipleVerbRoutes' }),
  ])

  const otherTarget = fixture.write(
    'src/features/users/routes/by-id/user-by-id.get.route.ts',
  )
  symlinkSync(
    otherTarget,
    path.join(
      fixture.root,
      'src/features/users/routes/index/linked.get.route.ts',
    ),
  )
  expect(await fixture.lintFile(getRoute)).toEqual([
    expect.objectContaining({ ruleId, messageId: 'multipleVerbRoutes' }),
  ])
})

test('manually applying the rule broadly leaves non-route files and unnamed input alone', async (context) => {
  const fixture = createFixture(context, { manual: true })
  const service = fixture.write('src/services/db.ts')

  expect(await fixture.lintFile(service)).toEqual([])
  expect(
    new Linter().verify('export const value = 1', [
      { plugins: { lss: plugin }, rules: { [ruleId]: 'error' } },
    ]),
  ).toEqual([])
})

test('combined config scopes to its application root from a parent cwd', async (context) => {
  const fixture = createFixture(context, { combined: true })
  const first = fixture.write(
    'src/features/users/routes/index/users.get.route.ts',
  )
  fixture.write('src/features/users/routes/index/other-users.get.route.ts')
  const sibling = fixture.write(
    '../other-service/src/features/users/routes/index/users.get.route.ts',
  )
  fixture.write(
    '../other-service/src/features/users/routes/index/other-users.get.route.ts',
  )

  expect(await fixture.lintFile(first)).toEqual([
    expect.objectContaining({ ruleId, messageId: 'multipleVerbRoutes' }),
  ])
  expect(await fixture.lintFile(sibling)).toEqual([])
})
