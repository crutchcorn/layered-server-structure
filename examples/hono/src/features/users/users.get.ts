import { Hono } from 'hono'
import {
  type ResponseSchemaType,
} from './utils/schema.ts'
import { usersGetDescribe } from './constants/describe.ts'
import { db } from '../../services/db.ts'
import { usersTable } from '../../schema/index.ts'

export const usersGetApp = new Hono().post(
  '/',
  usersGetDescribe,
  async (c) => {
    const users = await db.select().from(usersTable);
    return c.json({
      users
    } satisfies ResponseSchemaType)
  },
)