import { Hono } from 'hono'
import { usersTable } from '../../../../schema/index.ts'
import { db } from '../../../../services/db.ts'
import type { UsersListResponse } from '../../utils/schema.ts'
import { usersGetDescribe } from './middleware/describe.ts'

export const usersGetRoute = new Hono().get(
  '/',
  usersGetDescribe,
  async (c) => {
    const users = await db.select().from(usersTable)
    return c.json({ users } satisfies UsersListResponse)
  },
)
