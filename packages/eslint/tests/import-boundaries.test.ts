import { Linter, RuleTester } from 'eslint'
import tseslint from 'typescript-eslint'
import plugin from 'lss-eslint-plugin'
import { describe, expect, it, test } from 'vitest'

RuleTester.describe = describe
RuleTester.it = it
RuleTester.itOnly = it.only

const languageOptions: Linter.LanguageOptions = {
  parser: tseslint.parser,
  ecmaVersion: 'latest',
  sourceType: 'module',
}
const tester = new RuleTester({ languageOptions })

function invalid(code: string, source: string): RuleTester.InvalidTestCase {
  return {
    code,
    errors: [{ messageId: 'forbiddenImport', data: { source } }],
  }
}

const sourceExtensions = ['ts', 'tsx', 'js', 'jsx', 'mts', 'cts', 'mjs', 'cjs']

tester.run('handler-imports', plugin.rules['handler-imports'], {
  valid: [
    "import type { Context } from 'hono'; export function sendNotFound(c: Context) { return c.json({ error: 'Not found' }, 404); }",
    "import type { FastifyReply } from 'fastify'; export function sendCreated(reply: FastifyReply, payload: unknown) { return reply.code(201).send(payload); }",
    "import type { User } from '../types/user'; import { formatError } from '../utils/errors';",
    "import { statusCodes } from '../constants/http'; import { writeProblem } from './problem';",
    "export type { User } from '../types/user'; export * from './problem';",
    "const mod = import('../services/' + name);",
    'const mod = import(`../services/${name}`);',
    'const mod = require(moduleName);',
    "function inspect(require: (id: string) => unknown) { return require('../services/db'); }",
    "const require = (path: string) => path; require('../services/db');",
    "import { require } from './utils/test'; require('../services/db');",
  ],
  invalid: [
    invalid("import { db } from '../services/db';", '../services/db'),
    invalid("import db from '@/services/db';", '@/services/db'),
    invalid("import db from '#app/services/db';", '#app/services/db'),
    invalid("import db from '../services';", '../services'),
    invalid(
      "import { requireAuth } from '../middleware/require-auth';",
      '../middleware/require-auth',
    ),
    invalid("import { requireAuth } from '../middleware';", '../middleware'),
    invalid(
      "import { usersGet } from '../routes/index/users.get.route';",
      '../routes/index/users.get.route',
    ),
    invalid("import { usersRoute } from '../users.route';", '../users.route'),
    invalid("import { createUser } from '../users.logic';", '../users.logic'),
    invalid(
      "import type { DbClient } from '../services/db';",
      '../services/db',
    ),
    invalid("export * from '../middleware/auth';", '../middleware/auth'),
    invalid("const db = import('../services/db');", '../services/db'),
    invalid("const db = require('../services/db');", '../services/db'),
    invalid("type Db = import('../services/db').Db;", '../services/db'),
    invalid(
      "import route from '../users.route.ts?raw';",
      '../users.route.ts?raw',
    ),
    invalid(
      String.raw`import db from '..\\services\\db';`,
      String.raw`..\services\db`,
    ),
    ...sourceExtensions.map((extension) =>
      invalid(
        `import route from '../users.route.${extension}';`,
        `../users.route.${extension}`,
      ),
    ),
  ],
})

tester.run('middleware-imports', plugin.rules['middleware-imports'], {
  valid: [
    "import { createMiddleware } from 'hono/factory'; import { db } from '../services/db';",
    "import { describeRoute, resolver } from 'hono-openapi'; import { UserSchema } from '../../../utils/schema';",
    "import type { FastifyInstance } from 'fastify'; import { sendProblem } from '../handlers/send-problem';",
    "import { usersTable } from '../schema/index'; import { verifyToken } from './verify-token';",
    "import type { Session } from '../types/session'; import { AUTH_HEADER } from '../constants/auth';",
  ],
  invalid: [
    invalid(
      "import { usersGet } from '../routes/index/users.get.route';",
      '../routes/index/users.get.route',
    ),
    invalid(
      "import { describeUsers } from '../routes/index/middleware/describe';",
      '../routes/index/middleware/describe',
    ),
    invalid("import { usersRoute } from '../users.route';", '../users.route'),
    invalid("import { createUser } from '../users.logic';", '../users.logic'),
    invalid(
      "import type { UsersRoute } from '../users.route';",
      '../users.route',
    ),
    invalid(
      "import type { CreateUserInput } from '../users.logic';",
      '../users.logic',
    ),
    invalid(
      "const route = import('@/features/users/users.route');",
      '@/features/users/users.route',
    ),
    invalid("const logic = require('../users.logic');", '../users.logic'),
    ...sourceExtensions.flatMap((extension) =>
      ['route', 'logic'].map((kind) =>
        invalid(
          `import mod from '../users.${kind}.${extension}';`,
          `../users.${kind}.${extension}`,
        ),
      ),
    ),
  ],
})

tester.run('logic-imports', plugin.rules['logic-imports'], {
  valid: [
    "import { db } from '../services/db'; import { usersTable } from '../schema/index';",
    "import * as v from 'valibot'; import { normalizeEmail } from '../utils/email';",
    "import type { User } from '../types/user'; import { MAX_PAGE_SIZE } from '../constants/pagination';",
    "import { otherLogic } from '../shared.logic';",
  ],
  invalid: [
    invalid("import { Hono } from 'hono';", 'hono'),
    invalid("import { cors } from 'hono/cors';", 'hono/cors'),
    invalid("import { serve } from '@hono/node-server';", '@hono/node-server'),
    invalid("import { describeRoute } from 'hono-openapi';", 'hono-openapi'),
    invalid("import Fastify from 'fastify';", 'fastify'),
    invalid(
      "import websocket from '@fastify/websocket';",
      '@fastify/websocket',
    ),
    invalid("import express from 'express';", 'express'),
    invalid(
      "import { requireAuth } from '../middleware/auth';",
      '../middleware/auth',
    ),
    invalid(
      "import { sendProblem } from '../handlers/problem';",
      '../handlers/problem',
    ),
    invalid(
      "import { usersGet } from './routes/index/users.get.route';",
      './routes/index/users.get.route',
    ),
    invalid("import { usersRoute } from './users.route';", './users.route'),
  ],
})

tester.run('service-imports', plugin.rules['service-imports'], {
  valid: [
    "import { drizzle } from 'drizzle-orm/libsql';",
    "import { usersTable } from '../schema/index'; import * as v from 'valibot';",
    "import type { User } from '../types/user'; import { normalize } from '../utils/user';",
    "import { pool } from '../services/postgres'; export * from './cache';",
    "function inspect(require: (id: string) => unknown) { return require('hono'); }",
    "{ const require = (path: string) => path; require('fastify'); }",
    'const library = import(packageName);',
  ],
  invalid: [
    invalid("import { Hono } from 'hono';", 'hono'),
    invalid("import type { Context } from 'hono';", 'hono'),
    invalid("import { cors } from 'hono/cors';", 'hono/cors'),
    invalid("import { serve } from '@hono/node-server';", '@hono/node-server'),
    invalid("import { describeRoute } from 'hono-openapi';", 'hono-openapi'),
    invalid("import Fastify from 'fastify';", 'fastify'),
    invalid(
      "import websocket from '@fastify/websocket';",
      '@fastify/websocket',
    ),
    invalid("import express from 'express';", 'express'),
    invalid("import Koa from 'koa';", 'koa'),
    invalid("import { defineEventHandler } from 'h3';", 'h3'),
    invalid("import { Controller } from '@nestjs/common';", '@nestjs/common'),
    invalid(
      "import type { AuthContext } from '../middleware/require-auth';",
      '../middleware/require-auth',
    ),
    invalid(
      "import { sendProblem } from '../handlers/problem';",
      '../handlers/problem',
    ),
    invalid(
      "import { usersGet } from '../routes/index/users.get.route';",
      '../routes/index/users.get.route',
    ),
    invalid("import { usersRoute } from '../users.route';", '../users.route'),
    invalid("import { createUser } from '../users.logic';", '../users.logic'),
    invalid("export * from 'hono';", 'hono'),
    invalid("const Hono = require('hono');", 'hono'),
    invalid('const Hono = import(`hono`);', 'hono'),
    ...sourceExtensions.flatMap((extension) =>
      ['route', 'logic'].map((kind) =>
        invalid(
          `import mod from '../users.${kind}.${extension}';`,
          `../users.${kind}.${extension}`,
        ),
      ),
    ),
  ],
})

const usersRoute = 'src/features/users/users.route.ts'

function invalidIn(
  filename: string,
  code: string,
  source: string,
): RuleTester.InvalidTestCase {
  return { ...invalid(code, source), filename }
}

tester.run('pure-imports', plugin.rules['pure-imports'], {
  valid: [
    {
      filename: 'src/utils/email.ts',
      code: "import * as v from 'valibot'; import type { User } from '../types/user'; import { MAX_LENGTH } from '../constants/limits';",
    },
    {
      filename: 'src/schema/index.ts',
      code: "import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';",
    },
    {
      filename: 'src/constants/open-api.ts',
      code: "import type { GenerateSpecOptions } from 'hono-openapi'; export const openApiSpec: GenerateSpecOptions = {};",
    },
    {
      filename: 'src/types/http.ts',
      code: "import type { Context } from 'hono'; export type { FastifyReply } from 'fastify'; type Req = import('express').Request;",
    },
    {
      filename: 'C:\\project\\src\\constants\\open-api.ts',
      code: "import type { GenerateSpecOptions } from 'hono-openapi';",
    },
  ],
  invalid: [
    invalidIn(
      'src/utils/email.ts',
      "import { db } from '../services/db';",
      '../services/db',
    ),
    invalidIn(
      'src/utils/email.ts',
      "import type { Context } from 'hono';",
      'hono',
    ),
    invalidIn(
      'src/schema/index.ts',
      "import type { FastifyInstance } from 'fastify';",
      'fastify',
    ),
    invalidIn(
      'src/constants/describe.ts',
      "import { describeRoute } from 'hono-openapi';",
      'hono-openapi',
    ),
    invalidIn(
      'src/constants/describe.ts',
      "import { type GenerateSpecOptions, describeRoute } from 'hono-openapi';",
      'hono-openapi',
    ),
    invalidIn(
      'src/types/user.ts',
      "import type { DbClient } from '../services/db';",
      '../services/db',
    ),
    invalidIn(
      'src/types/user.ts',
      "import type { AuthContext } from '../middleware/auth';",
      '../middleware/auth',
    ),
    invalidIn(
      'src/utils/response.ts',
      "import { sendProblem } from '../handlers/send-problem';",
      '../handlers/send-problem',
    ),
    invalidIn(
      'src/constants/routes.ts',
      "import { usersGet } from '../features/users/routes/index/users.get.route';",
      '../features/users/routes/index/users.get.route',
    ),
    invalidIn(
      'src/utils/user.ts',
      "import { usersRoute } from '../features/users/users.route';",
      '../features/users/users.route',
    ),
    invalidIn(
      'src/utils/user.ts',
      "import { createUser } from '../features/users/users.logic';",
      '../features/users/users.logic',
    ),
    invalid("import { Hono } from 'hono';", 'hono'),
  ],
})

tester.run('feature-imports', plugin.rules['feature-imports'], {
  valid: [
    {
      filename: usersRoute,
      code: "import { usersGet } from './routes/index/users.get.route'; import { userByIdGet } from './routes/by-id/user-by-id.get.route';",
    },
    {
      filename: 'src/features/users/routes/by-id/user-by-id.get.route.ts',
      code: "import { UserSchema } from '../../utils/schema'; import { db } from '../../../../services/db'; import { sendProblem } from '../../../../handlers/problem';",
    },
    {
      filename: usersRoute,
      code: "import { requireAuth } from '@/middleware/require-auth'; import { usersGet } from '@/features/users/routes/index/users.get.route';",
    },
    {
      filename: 'src/features/users/features/profile/profile.route.ts',
      code: "import { UserSchema } from '../../utils/schema';",
    },
    {
      filename: usersRoute,
      code: "import { profileRoute } from './features/profile/profile.route';",
    },
    {
      filename: 'C:\\project\\src\\features\\users\\users.route.ts',
      code: "import { usersGet } from './routes/index/users.get.route'; import { db } from '../../services/db';",
    },
    // Entry points mounting multiple features are outside features/<feature>/.
    {
      filename: 'src/app.ts',
      code: "import { usersRoute } from './features/users/users.route'; import { messagesRoute } from './features/messages/messages.route';",
    },
  ],
  invalid: [
    invalidIn(
      usersRoute,
      "import { messagesRoute } from '../messages/messages.route';",
      '../messages/messages.route',
    ),
    invalidIn(
      'src/features/users/routes/index/users.get.route.ts',
      "import { MessageSchema } from '../../../messages/utils/schema';",
      '../../../messages/utils/schema',
    ),
    invalidIn(
      'src/features/users/middleware/check-user.ts',
      "import { verifyRoom } from '../../messages/middleware/verify-room';",
      '../../messages/middleware/verify-room',
    ),
    invalidIn(
      usersRoute,
      "import { MessageSchema } from '@/features/messages/utils/schema';",
      '@/features/messages/utils/schema',
    ),
    invalidIn(
      usersRoute,
      "import { MessageSchema } from '#app/features/messages/utils/schema';",
      '#app/features/messages/utils/schema',
    ),
    invalidIn(
      usersRoute,
      "import type { Message } from '../messages/types/message';",
      '../messages/types/message',
    ),
    invalidIn(
      'src/features/users/features/profile/profile.route.ts',
      "import { billingRoute } from '../billing/billing.route';",
      '../billing/billing.route',
    ),
    invalidIn(
      'C:\\project\\src\\features\\users\\users.route.ts',
      String.raw`import { messagesRoute } from '..\\messages\\messages.route';`,
      String.raw`..\messages\messages.route`,
    ),
  ],
})

function encapsulateInvalid(
  filename: string,
  code: string,
  messageId: 'sharedLayerImport' | 'internalFeatureImport',
  source: string,
): RuleTester.InvalidTestCase {
  return {
    filename,
    code,
    errors: [{ messageId, data: { source } }],
  }
}

tester.run('encapsulate-features', plugin.rules['encapsulate-features'], {
  valid: [
    {
      filename: 'src/app.ts',
      code: "import { usersRoute } from './features/users/users.route'; import { messagesRoute } from './features/messages/messages.route.ts';",
    },
    {
      filename: 'src/index.ts',
      code: "import { users } from './features/users'; import { messages } from './features/messages/index';",
    },
    {
      filename: usersRoute,
      code: "import { usersGet } from './routes/index/users.get.route'; import { userByIdGet } from './routes/by-id/user-by-id.get.route'; import { UserSchema } from './utils/schema';",
    },
    {
      filename: 'src/features/users/routes/by-id/user-by-id.get.route.ts',
      code: "import { UserSchema } from '../../utils/schema'; import { db } from '../../../../services/db';",
    },
    {
      filename: 'src/features/users/middleware/check-user.ts',
      code: "import { UserSchema } from '../utils/schema'; import { requestTiming } from '../../../middleware/request-timing';",
    },
    {
      filename: usersRoute,
      code: "import { profileRoute } from './features/profile/profile.route';",
    },
    {
      filename: 'src/features/users/features/profile/profile.route.ts',
      code: "import { UserSchema } from '../../utils/schema';",
    },
    {
      filename: 'C:\\project\\src\\app.ts',
      code: String.raw`import { usersRoute } from '.\\features\\users\\users.route';`,
    },
  ],
  invalid: [
    encapsulateInvalid(
      'src/app.ts',
      "import { usersGet } from './features/users/routes/index/users.get.route';",
      'internalFeatureImport',
      './features/users/routes/index/users.get.route',
    ),
    encapsulateInvalid(
      'src/app.ts',
      "import { userByIdGet } from './features/users/routes/by-id/user-by-id.get.route.ts';",
      'internalFeatureImport',
      './features/users/routes/by-id/user-by-id.get.route.ts',
    ),
    encapsulateInvalid(
      'src/app.ts',
      "import { usersGet } from '@/features/users/routes/index/users.get.route';",
      'internalFeatureImport',
      '@/features/users/routes/index/users.get.route',
    ),
    encapsulateInvalid(
      'src/app.ts',
      "import { UserSchema } from './features/users/utils/schema';",
      'internalFeatureImport',
      './features/users/utils/schema',
    ),
    encapsulateInvalid(
      'src/app.ts',
      "import { createUser } from './features/users/users.logic';",
      'internalFeatureImport',
      './features/users/users.logic',
    ),
    encapsulateInvalid(
      'src/middleware/require-auth.ts',
      "import { usersRoute } from '../features/users/users.route';",
      'sharedLayerImport',
      '../features/users/users.route',
    ),
    encapsulateInvalid(
      'src/handlers/send-problem.ts',
      "import type { User } from '../features/users/types/user';",
      'sharedLayerImport',
      '../features/users/types/user',
    ),
    encapsulateInvalid(
      'src/services/db.ts',
      "import { UserSchema } from '@/features/users/utils/schema';",
      'sharedLayerImport',
      '@/features/users/utils/schema',
    ),
    encapsulateInvalid(
      'src/utils/format.ts',
      "import { features } from '../features';",
      'sharedLayerImport',
      '../features',
    ),
    encapsulateInvalid(
      'src/features/users/utils/helper.ts',
      "import { profileRoute } from '../features/profile/profile.route';",
      'sharedLayerImport',
      '../features/profile/profile.route',
    ),
    encapsulateInvalid(
      usersRoute,
      "import { avatarPost } from './features/profile/routes/avatar/avatar.post.route';",
      'internalFeatureImport',
      './features/profile/routes/avatar/avatar.post.route',
    ),
    encapsulateInvalid(
      'C:\\project\\src\\app.ts',
      String.raw`import { usersGet } from '.\\features\\users\\routes\\index\\users.get.route';`,
      'internalFeatureImport',
      String.raw`.\features\users\routes\index\users.get.route`,
    ),
  ],
})

const baseConfig: Linter.Config = {
  files: ['**/*.{ts,tsx,js,jsx,mjs,cjs,mts,cts}'],
  languageOptions,
}

test('JavaScript consumers can use the default ESLint parser', () => {
  const messages = new Linter().verify(
    "import { Hono } from 'hono'; export const db = {};",
    [...plugin.configs.recommended],
    { filename: 'src/services/db.js' },
  )
  expect(messages).toHaveLength(1)
  expect(messages[0]?.ruleId).toBe('lss/service-imports')
})

test('recommended configuration scopes layers without replacing application restrictions', () => {
  const linter = new Linter()
  const config: Linter.Config[] = [
    baseConfig,
    {
      rules: {
        'no-restricted-imports': ['error', { paths: ['app-forbidden'] }],
      },
    },
    ...plugin.configs.recommended,
  ]

  const messages = linter.verify(
    "import secret from 'app-forbidden'; import { db } from '../../services/db';",
    config,
    { filename: 'src/handlers/problem.ts' },
  )
  expect(messages.map((message) => message.ruleId).sort()).toEqual([
    'lss/handler-imports',
    'no-restricted-imports',
  ])
  for (const entry of plugin.configs.recommended) {
    expect(entry.rules).toBeDefined()
    expect(entry.rules).not.toHaveProperty('no-restricted-imports')
  }
})
