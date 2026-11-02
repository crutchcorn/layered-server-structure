import { eq } from 'drizzle-orm'
import { Hono } from 'hono'
import { validator } from 'hono-openapi'
import { sendProblem } from '../../../../handlers/send-problem.ts'
import { usersTable } from '../../../../schema/index.ts'
import { db } from '../../../../services/db.ts'
import { UserIdParamSchema } from '../../utils/schema.ts'
import type { UserResponse } from '../../utils/schema.ts'
import { userByIdGetDescribe } from './middleware/describe.ts'

export const userByIdGetRoute = new Hono().get(
  '/:id',
  userByIdGetDescribe,
  validator('param', UserIdParamSchema),
  async (c) => {
    const { id } = c.req.valid('param')
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id))
    if (!user) {
      return sendProblem(c, 404, 'User not found')
    }
    return c.json({ user } satisfies UserResponse)
  },
)
