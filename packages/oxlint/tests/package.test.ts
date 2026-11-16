import { execFileSync, spawnSync } from 'node:child_process'
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { findPackageJSON } from 'node:module'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from 'vitest'

test('Oxlint applies the packed plugin and its presets', ({
  onTestFinished,
}) => {
  const directory = mkdtempSync(path.join(tmpdir(), 'lss-oxlint-'))
  onTestFinished(() => rmSync(directory, { recursive: true, force: true }))

  const packageDirectory = fileURLToPath(new URL('..', import.meta.url))
  const packResult: Record<string, { filename: string }> = JSON.parse(
    execFileSync(
      'npm',
      [
        'pack',
        '--ignore-scripts',
        '--offline',
        '--json',
        '--cache',
        path.join(directory, 'npm-cache'),
        '--pack-destination',
        directory,
      ],
      { cwd: packageDirectory, encoding: 'utf8' },
    ),
  )

  const [packed] = Object.values(packResult)
  if (!packed) throw new Error('npm pack must produce a package')

  const modulesDirectory = path.join(directory, 'node_modules')
  const pluginDirectory = path.join(modulesDirectory, 'lss-oxlint-plugin')
  mkdirSync(pluginDirectory, { recursive: true })
  execFileSync('tar', [
    '-xzf',
    path.join(directory, packed.filename),
    '-C',
    pluginDirectory,
    '--strip-components=1',
  ])

  for (const dependency of [
    '@oxlint/plugins',
    'eslint-plugin-project-structure',
    'oxlint',
  ]) {
    const manifest = findPackageJSON(dependency, import.meta.url)
    if (!manifest) throw new Error(`Could not resolve ${dependency}`)
    const destination = path.join(modulesDirectory, dependency)
    mkdirSync(path.dirname(destination), { recursive: true })
    symlinkSync(path.dirname(manifest), destination, 'junction')
  }

  function write(file: string, contents: string) {
    const filename = path.join(directory, file)
    mkdirSync(path.dirname(filename), { recursive: true })
    writeFileSync(filename, contents)
  }

  write(
    'oxlint.config.mjs',
    `import { createLssConfig } from 'lss-oxlint-plugin'
    export default {
      extends: [createLssConfig({ root: import.meta.dirname })],
      categories: { correctness: 'off' },
    }`,
  )

  write('src/app.ts', "import './features/users/routes/index/users.get.route'")
  write('src/index.ts', "import './features/users/users.route'")
  write(
    'src/handlers/problem.ts',
    "function local(require: (id: string) => unknown) { return require('../services/db') }\nrequire('../services/db')",
  )
  write('src/middleware/auth.ts', "import '../features/users/users.logic'")
  write('src/services/db.ts', "import 'hono'")
  write('src/types/http.ts', "export type * from 'hono'")
  write('src/utils/http.ts', "type Context = import('hono').Context")
  write('src/features/users/users.logic.ts', "import 'hono'")
  write('src/features/users/details.logic.ts', 'export {}')
  write(
    'src/features/users/users.route.ts',
    "import '../messages/messages.route'",
  )
  write('src/features/users/routes/index/users.get.route.ts', 'export {}')
  write('src/features/users/routes/index/details.get.route.ts', 'export {}')
  write('src/BadFile.ts', 'export {}')

  const result = spawnSync(
    process.execPath,
    [
      path.join(modulesDirectory, 'oxlint/bin/oxlint'),
      '-c',
      'oxlint.config.mjs',
      '--threads=1',
      '--format=json',
      'src',
    ],
    { cwd: directory, encoding: 'utf8' },
  )
  if (result.error) throw result.error
  expect(result.status, result.stderr || result.stdout).toBe(1)
  expect(result.stdout, result.stderr).not.toBe('')

  const { diagnostics }: { diagnostics: { code: string; filename: string }[] } =
    JSON.parse(result.stdout)
  const actual = diagnostics
    .map(({ code, filename }) => `${filename}: ${code}`)
    .sort()

  expect(actual).toEqual(
    [
      'src/app.ts: lss(encapsulate-features)',
      'src/handlers/problem.ts: lss(handler-imports)',
      'src/middleware/auth.ts: lss(middleware-imports)',
      'src/middleware/auth.ts: lss(encapsulate-features)',
      'src/services/db.ts: lss(service-imports)',
      'src/utils/http.ts: lss(pure-imports)',
      'src/features/users/users.logic.ts: lss(logic-imports)',
      'src/features/users/users.logic.ts: lss(one-logic-per-folder)',
      'src/features/users/details.logic.ts: lss(one-logic-per-folder)',
      'src/features/users/users.route.ts: lss(feature-imports)',
      'src/features/users/routes/index/users.get.route.ts: lss(route-files)',
      'src/features/users/routes/index/details.get.route.ts: lss(route-files)',
      'src/BadFile.ts: lss(folder-structure)',
    ].sort(),
  )
}, 30_000)
