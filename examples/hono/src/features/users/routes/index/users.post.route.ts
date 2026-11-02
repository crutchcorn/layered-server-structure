import { Hono } from 'hono'
import { validator } from 'hono-openapi'
import { usersTable } from '../../../../schema/index.ts'
import { db } from '../../../../services/db.ts'
import { CreateUserSchema } from '../../utils/schema.ts'
import type { UserResponse } from '../../utils/schema.ts'
import { usersPostDescribe } from './middleware/describe.ts'

export const usersPostRoute = new Hono().post(
  '/',
  usersPostDescribe,
  validator('json', CreateUserSchema),
  async (c) => {
    const input = c.req.valid('json')
    const [user] = await db.insert(usersTable).values(input).returning()
    return c.json({ user: user! } satisfies UserResponse, 201)
  },
)
